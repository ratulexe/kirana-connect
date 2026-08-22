import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Stepper from "../components/Stepper.jsx";
import PageLoader from "../components/PageLoader.jsx";
import Alert from "../components/Alert.jsx";
import StoreDetailsStep from "../features/onboarding/StoreDetailsStep.jsx";
import AddressStep from "../features/onboarding/AddressStep.jsx";
import HoursStep from "../features/onboarding/HoursStep.jsx";
import ReviewStep from "../features/onboarding/ReviewStep.jsx";
import { defaultHours } from "../features/onboarding/schema.js";
import { WIZARD_STEPS, ONBOARDING_STEP_OFFSET } from "../features/onboarding/steps.js";
import { useOnboardingStatus, useSubmitStore } from "../features/onboarding/useOnboarding.js";
import { useEntranceAnimation } from "../animations/useEntranceAnimation.js";

const STEP_TITLES = [
  { title: "Your store", subtitle: "The basics customers will see first." },
  { title: "Where you are", subtitle: "Your address, and the exact spot on the map." },
  { title: "Opening hours", subtitle: "When customers can walk in." },
  { title: "Review and submit", subtitle: "Check everything before it goes for verification." },
];

/** Owner name and phone captured at signup, if this is the same browser. */
function readOwnerDraft() {
  try {
    return JSON.parse(sessionStorage.getItem("kc-store-owner") ?? "{}");
  } catch {
    return {};
  }
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [store, setStore] = useState({ name: "", description: "", phone: "" });
  const [address, setAddress] = useState({
    address_line_1: "",
    address_line_2: "",
    locality: "",
    city: "",
    state: "",
    postal_code: "",
    latitude: undefined,
    longitude: undefined,
  });
  const [hours, setHours] = useState(defaultHours);

  const { data: status, isPending, isError, error } = useOnboardingStatus();
  const submitStore = useSubmitStore();
  const containerRef = useEntranceAnimation(step);

  useEffect(() => {
    // Moving between steps should start at the top of the new step.
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const ownerDraft = useMemo(() => readOwnerDraft(), []);

  if (isPending) return <PageLoader label="Loading your registration" />;

  if (isError) {
    return (
      <Container className="py-12">
        <Alert tone="error" title="Could not load your registration">
          {error?.message ?? "Please try again in a moment."}
        </Alert>
      </Container>
    );
  }

  // Already applied: the status screen owns that story.
  if (status.status !== "no_application") return <Navigate to="/status" replace />;

  const handleSubmit = () => {
    submitStore.mutate({
      ...store,
      ...address,
      owner_full_name: ownerDraft.full_name ?? status.profile?.full_name ?? undefined,
      owner_phone: ownerDraft.phone ?? status.profile?.phone ?? undefined,
      hours: hours.map((day) => ({
        day_of_week: day.day_of_week,
        is_closed: day.is_closed,
        opens_at: day.is_closed ? null : day.opens_at,
        closes_at: day.is_closed ? null : day.closes_at,
      })),
    });
  };

  if (submitStore.isSuccess) return <Navigate to="/status" replace />;

  const heading = STEP_TITLES[step];

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Stepper steps={WIZARD_STEPS} currentIndex={step + ONBOARDING_STEP_OFFSET} />

        <div ref={containerRef}>
          <h1 data-animate className="mt-5 text-heading text-ink">
            {heading.title}
          </h1>
          <p data-animate className="mt-2 text-body text-ink-muted">
            {heading.subtitle}
          </p>

          <Card data-animate className="mt-6 p-5 sm:p-6">
            {step === 0 ? (
              <StoreDetailsStep
                defaultValues={store}
                onNext={(values) => {
                  setStore(values);
                  setStep(1);
                }}
              />
            ) : null}

            {step === 1 ? (
              <AddressStep
                defaultValues={address}
                onBack={() => setStep(0)}
                onNext={(values) => {
                  setAddress(values);
                  setStep(2);
                }}
              />
            ) : null}

            {step === 2 ? (
              <HoursStep
                defaultValues={{ hours }}
                onBack={() => setStep(1)}
                onNext={(values) => {
                  setHours(values.hours);
                  setStep(3);
                }}
              />
            ) : null}

            {step === 3 ? (
              <ReviewStep
                values={{ store, address, hours }}
                onBack={() => setStep(2)}
                onEditStep={setStep}
                onSubmit={handleSubmit}
                isSubmitting={submitStore.isPending}
                error={
                  submitStore.isError
                    ? (submitStore.error?.message ?? "Please try again.")
                    : ""
                }
              />
            ) : null}
          </Card>
        </div>
      </div>
    </Container>
  );
}
