import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookmarkCheck, Check, CircleCheck, PackageSearch, Search, XCircle } from "lucide-react";
import Container from "../components/Container.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import Skeleton from "../components/Skeleton.jsx";
import Field, { TextInput } from "../components/Field.jsx";
import {
  useStoreReservations,
  useReservationLookup,
  useCollectReservation,
} from "../features/reservations/useReservations.js";
import { formatPickupWindow, formatReservationDateTime } from "../utils/reservationTime.js";

// Only the lookup panel can ever show a non-active reservation (a code
// search can return the most recent reservation for that code even after it
// has gone terminal, since a code is only unique while active). The store's
// "Active reservations" list itself is always pre-filtered to active rows.
const TERMINAL_STATUS_STYLE = {
  collected: { label: "Collected", icon: Check, className: "bg-success-soft text-success" },
  cancelled: { label: "Released by customer", icon: XCircle, className: "bg-surface-sunken text-ink-muted" },
  expired: { label: "Expired", icon: XCircle, className: "bg-surface-sunken text-ink-muted" },
};

// The reservation code is the customer's own pickup-verification secret --
// the whole point is defeated if staff can just read it off the shelf list
// and tap "collected" without the customer ever saying it. So the code is
// never shown in the Active reservations list, and collecting from there
// requires typing back what the customer tells you. The one exception is a
// row reached via the lookup panel below: staff already had to type the
// code to find it, so re-typing it here would be pure friction.
function normalizeCode(input) {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return "";
  return trimmed.startsWith("KC-") ? trimmed : `KC-${trimmed}`;
}

/**
 * One reservation row. When `requireCodeToCollect` is set, "Mark as
 * collected" is gated behind typing the code the customer states out loud --
 * a stronger, deliberate replacement for the old accidental-tap-only
 * confirm, and the reservation code itself is never displayed on the card.
 */
function ReservationRow({ reservation, storeId, onCollected, showCode = false, requireCodeToCollect = false }) {
  const [verifying, setVerifying] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [error, setError] = useState("");
  const collectMutation = useCollectReservation(storeId);
  const variant = reservation.product;

  const cancel = () => {
    setVerifying(false);
    setCodeInput("");
    setCodeError("");
    setError("");
  };

  const collect = () => {
    setError("");
    collectMutation.mutate(reservation.id, {
      onSuccess: () => {
        cancel();
        onCollected?.(reservation);
      },
      onError: (err) => setError(err?.message ?? "Could not mark this reservation collected."),
    });
  };

  const confirmWithCode = () => {
    if (normalizeCode(codeInput) !== reservation.reservation_code) {
      setCodeError("That code doesn't match this reservation. Ask the customer to repeat it.");
      return;
    }
    setCodeError("");
    collect();
  };

  return (
    <li className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {showCode ? (
          <p className="font-mono text-lg font-black tracking-wide text-primary">{reservation.reservation_code}</p>
        ) : null}
        <p className={showCode ? "mt-1 text-card text-ink" : "text-card text-ink"}>{variant?.name ?? "Product"}</p>
        <p className="text-meta text-ink-muted">
          {[variant?.unit_label, variant?.size_label, variant?.color].filter(Boolean).join(" - ")}
          {reservation.quantity > 1 ? ` - Qty ${reservation.quantity}` : ""}
        </p>
        <p className="mt-2 text-meta text-ink-soft">
          Pickup <span className="font-semibold text-ink">{formatPickupWindow(reservation.pickup_window_start, reservation.pickup_window_end)}</span>
        </p>
        <p className="text-meta text-ink-muted">
          Reserved until <span className="font-semibold text-ink">{formatReservationDateTime(reservation.expires_at)}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        {error ? <Alert tone="error" className="max-w-xs">{error}</Alert> : null}
        {reservation.status !== "active" ? (
          (() => {
            const style = TERMINAL_STATUS_STYLE[reservation.status];
            const StatusIcon = style?.icon ?? XCircle;
            return (
              <span
                className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-meta font-semibold ${style?.className ?? "bg-surface-sunken text-ink-muted"}`}
              >
                <StatusIcon className="size-3.5" aria-hidden="true" />
                {style?.label ?? reservation.status}
              </span>
            );
          })()
        ) : verifying && requireCodeToCollect ? (
          <div className="flex flex-col items-stretch gap-2 sm:items-end sm:w-56">
            {codeError ? <Alert tone="error" className="max-w-xs">{codeError}</Alert> : null}
            <TextInput
              autoFocus
              value={codeInput}
              onChange={(event) => {
                setCodeInput(event.target.value);
                setCodeError("");
              }}
              placeholder="Ask for their code, e.g. KC-0000"
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={cancel} disabled={collectMutation.isPending}>
                Cancel
              </Button>
              <Button size="sm" isLoading={collectMutation.isPending} onClick={confirmWithCode} disabled={!codeInput.trim()}>
                Confirm collected
              </Button>
            </div>
          </div>
        ) : verifying ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={cancel} disabled={collectMutation.isPending}>
              Cancel
            </Button>
            <Button size="sm" isLoading={collectMutation.isPending} onClick={collect}>
              Confirm collected
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setVerifying(true)}>
            <CircleCheck className="size-4" aria-hidden="true" />
            {requireCodeToCollect ? "Verify & mark collected" : "Mark as collected"}
          </Button>
        )}
      </div>
    </li>
  );
}

function LookupPanel({ storeId }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const lookup = useReservationLookup(storeId);

  const submit = (event) => {
    event.preventDefault();
    setResult(null);
    const trimmed = code.trim();
    if (!trimmed) return;
    lookup.mutate(trimmed, {
      onSuccess: (data) => setResult({ reservation: data }),
      onError: (error) => setResult({ error: error?.message ?? "No reservation found with that code." }),
    });
  };

  return (
    <Card className="p-5">
      <h2 className="text-card text-ink">Find a reservation</h2>
      <p className="mt-1 text-meta text-ink-muted">Search by the code the customer shows you, e.g. KC-4821.</p>
      <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
        <Field label="Reservation code" className="min-w-[10rem] flex-1">
          {(field) => (
            <TextInput
              {...field}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="KC-0000"
            />
          )}
        </Field>
        <Button type="submit" isLoading={lookup.isPending}>
          <Search className="size-4" aria-hidden="true" />
          Find
        </Button>
      </form>

      {result?.error ? <Alert tone="error" className="mt-3">{result.error}</Alert> : null}
      {result?.reservation ? (
        <ul className="mt-3">
          <ReservationRow
            reservation={result.reservation}
            storeId={storeId}
            showCode
            onCollected={(collected) => setResult({ reservation: { ...collected, status: "collected" } })}
          />
        </ul>
      ) : null}
    </Card>
  );
}

export default function Reservations() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get("store_id") ?? undefined;
  const reservations = useStoreReservations(storeId);
  const [justCollected, setJustCollected] = useState(null);

  const list = (reservations.data ?? []).filter((r) => r.id !== justCollected);

  return (
    <Container className="py-10 sm:py-12">
      <h1 className="flex items-center gap-2.5 text-heading text-ink">
        <BookmarkCheck className="size-6 text-primary" aria-hidden="true" />
        Reservations
      </h1>
      <p className="mt-1 text-body text-ink-muted">
        Customers who reserved an item hold it here until pickup or expiry -- nothing leaves your
        recorded stock until you mark a reservation collected.
      </p>

      <div className="mt-6">
        <LookupPanel storeId={storeId} />
      </div>

      <div className="mt-8">
        <h2 className="text-card text-ink">Active reservations</h2>

        {reservations.isPending ? (
          <div className="mt-3 space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : null}

        {reservations.isError ? (
          <Alert tone="error" className="mt-3">
            {reservations.error?.status === 403
              ? "Your store is still awaiting verification."
              : (reservations.error?.message ?? "Could not load reservations.")}
          </Alert>
        ) : null}

        {!reservations.isPending && !reservations.isError && list.length === 0 ? (
          <Card className="mt-3 flex flex-col items-center gap-2 p-8 text-center">
            <PackageSearch className="size-8 text-ink-muted" aria-hidden="true" />
            <p className="text-card text-ink">No active reservations right now</p>
            <p className="text-meta text-ink-muted">
              When a customer reserves an item from your store, it appears here.
            </p>
          </Card>
        ) : null}

        {list.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {list.map((reservation) => (
              <ReservationRow
                key={reservation.id}
                reservation={reservation}
                storeId={storeId}
                requireCodeToCollect
                onCollected={(collected) => setJustCollected(collected.id)}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </Container>
  );
}
