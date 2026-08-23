import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CircleCheck, Clock, MapPin, Pencil, Phone, Store as StoreIcon } from "lucide-react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Container from "../components/Container.jsx";
import PageLoader from "../components/PageLoader.jsx";
import Stepper from "../components/Stepper.jsx";
import AddressStep from "../features/onboarding/AddressStep.jsx";
import HoursStep from "../features/onboarding/HoursStep.jsx";
import ReviewStep from "../features/onboarding/ReviewStep.jsx";
import StoreDetailsStep from "../features/onboarding/StoreDetailsStep.jsx";
import { DAY_LABELS, defaultHours } from "../features/onboarding/schema.js";
import {
  useOnboardingStatus,
  useSubmitStoreChange,
} from "../features/onboarding/useOnboarding.js";

const EDIT_STEPS = ["Store", "Address", "Hours", "Review"];

function timeValue(value) {
  return typeof value === "string" ? value.slice(0, 5) : "";
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hoursFromStore(hours = []) {
  const next = defaultHours();
  for (const hour of hours) {
    next[hour.day_of_week] = {
      day_of_week: hour.day_of_week,
      is_closed: Boolean(hour.is_closed),
      opens_at: hour.is_closed ? "" : timeValue(hour.opens_at),
      closes_at: hour.is_closed ? "" : timeValue(hour.closes_at),
    };
  }
  return next;
}

function draftsFrom(store, pendingChange) {
  const source = pendingChange?.payload ?? store;
  return {
    store: {
      name: source.name ?? "",
      description: source.description ?? "",
      phone: source.phone ?? "",
    },
    address: {
      address_line_1: source.address_line_1 ?? "",
      address_line_2: source.address_line_2 ?? "",
      locality: source.locality ?? "",
      city: source.city ?? "",
      state: source.state ?? "",
      postal_code: source.postal_code ?? "",
      latitude: numberValue(source.latitude),
      longitude: numberValue(source.longitude),
    },
    hours: hoursFromStore(pendingChange?.hours ?? store.hours ?? []),
  };
}

function addressLine(store) {
  return `${store.address_line_1}${store.address_line_2 ? `, ${store.address_line_2}` : ""}, ${store.locality}, ${store.city}, ${store.state} ${store.postal_code}`;
}

function hoursLabel(hour) {
  return hour.is_closed ? "Closed" : `${timeValue(hour.opens_at)} - ${timeValue(hour.closes_at)}`;
}

function DetailRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-3 px-4 py-4 sm:px-5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-meta font-semibold text-ink-soft">{title}</p>
        <div className="mt-1 text-body text-ink">{children}</div>
      </div>
    </div>
  );
}

export default function StoreDetails() {
  const { data, isPending, isError, error } = useOnboardingStatus();
  const submitChange = useSubmitStoreChange();
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [storeDraft, setStoreDraft] = useState(null);
  const [addressDraft, setAddressDraft] = useState(null);
  const [hoursDraft, setHoursDraft] = useState(defaultHours);

  const store = data?.stores?.[0] ?? null;
  const pendingChange = store?.pending_change ?? null;
  const isApproved = data?.status === "approved";
  if (isPending) return <PageLoader label="Loading store details" />;

  if (isError) {
    return (
      <Container className="py-12">
        <Alert tone="error" title="Could not load store details">
          {error?.message ?? "Please try again in a moment."}
        </Alert>
      </Container>
    );
  }

  if (data.status === "no_application") return <Navigate to="/onboarding" replace />;

  const startEditing = () => {
    const drafts = draftsFrom(store, pendingChange);
    setStoreDraft(drafts.store);
    setAddressDraft(drafts.address);
    setHoursDraft(drafts.hours);
    setStep(0);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setStep(0);
    submitChange.reset();
  };

  const handleSubmit = () => {
    submitChange.mutate(
      {
        storeId: store.id,
        payload: {
          ...storeDraft,
          ...addressDraft,
          hours: hoursDraft.map((day) => ({
            day_of_week: day.day_of_week,
            is_closed: day.is_closed,
            opens_at: day.is_closed ? null : day.opens_at,
            closes_at: day.is_closed ? null : day.closes_at,
          })),
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setStep(0);
        },
      },
    );
  };

  if (isEditing && storeDraft && addressDraft) {
    return (
      <Container className="py-10 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-heading text-ink">Edit store details</h1>
              <p className="mt-1 text-body text-ink-muted">
                Changes go to admin review before customers see them.
              </p>
            </div>
            <Button variant="secondary" onClick={cancelEditing}>
              Cancel
            </Button>
          </div>

          <Stepper steps={EDIT_STEPS} currentIndex={step} />

          <Card className="mt-6 p-5 sm:p-6">
            {step === 0 ? (
              <StoreDetailsStep
                defaultValues={storeDraft}
                onNext={(values) => {
                  setStoreDraft(values);
                  setStep(1);
                }}
              />
            ) : null}

            {step === 1 ? (
              <AddressStep
                defaultValues={addressDraft}
                onBack={() => setStep(0)}
                onNext={(values) => {
                  setAddressDraft(values);
                  setStep(2);
                }}
              />
            ) : null}

            {step === 2 ? (
              <HoursStep
                defaultValues={{ hours: hoursDraft }}
                onBack={() => setStep(1)}
                onNext={(values) => {
                  setHoursDraft(values.hours);
                  setStep(3);
                }}
              />
            ) : null}

            {step === 3 ? (
              <ReviewStep
                values={{ store: storeDraft, address: addressDraft, hours: hoursDraft }}
                onBack={() => setStep(2)}
                onEditStep={setStep}
                onSubmit={handleSubmit}
                isSubmitting={submitChange.isPending}
                error={
                  submitChange.isError
                    ? (submitChange.error?.message ?? "Please try again.")
                    : ""
                }
                errorTitle="Could not submit store changes"
                infoText="Submitting creates a pending review. Your current store details stay live until an admin approves the update."
                submitLabel={pendingChange ? "Update pending review" : "Submit changes for review"}
                submittingLabel="Submitting changes..."
              />
            ) : null}
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-heading text-ink">Store details</h1>
            <p className="mt-1 text-body text-ink-muted">
              These are the details customers see after approval.
            </p>
          </div>
          {isApproved ? (
            <Button onClick={startEditing}>
              <Pencil className="size-4" aria-hidden="true" />
              {pendingChange ? "Edit pending change" : "Edit details"}
            </Button>
          ) : null}
        </div>

        {!isApproved ? (
          <Alert tone="info" className="mt-5">
            Your store is already under review. Details can be edited after the first approval.
          </Alert>
        ) : null}

        {pendingChange ? (
          <Alert tone="warning" className="mt-5">
            A store details update is waiting for admin approval. Current details remain live
            until that review is approved.
          </Alert>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <div className="divide-y divide-line-soft">
              <DetailRow icon={StoreIcon} title="Store">
                <p className="font-semibold">{store.name}</p>
                {store.description ? (
                  <p className="mt-0.5 text-meta text-ink-muted">{store.description}</p>
                ) : null}
              </DetailRow>

              <DetailRow icon={MapPin} title="Address">
                <p>{addressLine(store)}</p>
                <p className="mt-1 text-meta text-ink-muted tabular-nums">
                  Pin at {Number(store.latitude).toFixed(5)}, {Number(store.longitude).toFixed(5)}
                </p>
              </DetailRow>

              <DetailRow icon={Phone} title="Phone">
                <p className="tabular-nums">{store.phone || "Not set"}</p>
              </DetailRow>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-section text-ink">Review status</h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-meta font-semibold ${
                  isApproved ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                }`}
              >
                {isApproved ? (
                  <CircleCheck className="size-3.5" aria-hidden="true" />
                ) : (
                  <Clock className="size-3.5" aria-hidden="true" />
                )}
                {isApproved ? "Approved" : "Pending"}
              </span>
            </div>
            <p className="mt-3 text-body text-ink-muted">
              {pendingChange
                ? "One submitted edit is waiting for an admin review."
                : "No store detail edits are waiting for review."}
            </p>
            <Button as={Link} to="/status" variant="secondary" className="mt-5">
              Back to dashboard
            </Button>
          </Card>
        </div>

        <Card className="mt-4 p-5">
          <h2 className="text-section text-ink">Opening hours</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(store.hours ?? []).map((hour) => (
              <div key={hour.day_of_week} className="rounded-control border border-line-soft px-3 py-2 text-meta">
                <p className="font-semibold text-ink">{DAY_LABELS[hour.day_of_week]}</p>
                <p className="text-ink-muted">{hoursLabel(hour)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Container>
  );
}
