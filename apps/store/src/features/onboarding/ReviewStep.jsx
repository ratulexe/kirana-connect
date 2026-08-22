import { ArrowLeft, Check, MapPin, Pencil, Phone, Store as StoreIcon } from "lucide-react";
import Button from "../../components/Button.jsx";
import Alert from "../../components/Alert.jsx";
import { DAY_LABELS } from "./schema.js";

function Row({ icon: Icon, title, children, onEdit, editLabel }) {
  return (
    <div className="flex gap-3 px-4 py-4 sm:px-5">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-meta font-semibold text-ink-soft">{title}</p>
        <div className="mt-1 text-body text-ink">{children}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit} aria-label={editLabel}>
        <Pencil className="size-3.5" aria-hidden="true" />
        Edit
      </Button>
    </div>
  );
}

/**
 * Final confirmation before anything is created.
 *
 * Submission lives only here: earlier steps advance with their own buttons and
 * never post, so an accidental Enter keypress mid-wizard cannot register a store.
 */
export default function ReviewStep({ values, onBack, onEditStep, onSubmit, isSubmitting, error }) {
  const { store, address, hours } = values;
  const openDays = hours.filter((day) => !day.is_closed);

  return (
    <div className="flex flex-col gap-5">
      {error ? <Alert tone="error" title="Could not submit your store">{error}</Alert> : null}

      <div className="divide-y divide-line-soft rounded-card border border-line bg-surface">
        <Row icon={StoreIcon} title="Store" onEdit={() => onEditStep(0)} editLabel="Edit store details">
          <p className="font-semibold">{store.name}</p>
          {store.description ? (
            <p className="mt-0.5 text-meta text-ink-muted">{store.description}</p>
          ) : null}
        </Row>

        <Row icon={MapPin} title="Address" onEdit={() => onEditStep(1)} editLabel="Edit address">
          <p>
            {[address.address_line_1, address.address_line_2].filter(Boolean).join(", ")}
          </p>
          <p className="text-ink-soft">
            {address.locality}, {address.city}, {address.state} {address.postal_code}
          </p>
          <p className="mt-1 text-meta text-ink-muted tabular-nums">
            Pin at {Number(address.latitude).toFixed(5)}, {Number(address.longitude).toFixed(5)}
          </p>
        </Row>

        {store.phone ? (
          <Row icon={Phone} title="Phone" onEdit={() => onEditStep(0)} editLabel="Edit store phone">
            <p className="tabular-nums">{store.phone}</p>
          </Row>
        ) : null}

        <Row icon={Check} title="Opening hours" onEdit={() => onEditStep(2)} editLabel="Edit opening hours">
          {openDays.length === 0 ? (
            <p className="text-ink-muted">Marked closed every day</p>
          ) : (
            <ul className="space-y-0.5 text-meta">
              {hours.map((day) => (
                <li key={day.day_of_week} className="flex justify-between gap-4">
                  <span className="text-ink-soft">{DAY_LABELS[day.day_of_week]}</span>
                  <span className="tabular-nums">
                    {day.is_closed ? "Closed" : `${day.opens_at} - ${day.closes_at}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Row>
      </div>

      <Alert tone="info">
        Submitting sends your store for verification. It stays hidden from customers
        until it is approved.
      </Alert>

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Button type="button" onClick={onSubmit} isLoading={isSubmitting} size="lg">
          {isSubmitting ? "Submitting..." : "Submit store for verification"}
        </Button>
      </div>
    </div>
  );
}
