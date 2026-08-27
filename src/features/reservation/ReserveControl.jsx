import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bookmark, Check, Copy, LogIn, Navigation, PackageX } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import Modal from "../../components/common/Modal.jsx";
import SuccessTick from "../../components/common/SuccessTick.jsx";
import { useAuth } from "../../auth/useAuth.js";
import { useCreateReservation, useCancelReservation } from "../../hooks/useReservations.js";
import { directionsUrl } from "../../utils/directions.js";
import { formatPickupWindow, formatReservationDateTime } from "../../utils/reservationTime.js";

const MAX_WINDOW_HOURS = 6;
const EXPIRY_BUFFER_MS = 60 * 60 * 1000;

function todayLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function combineDateAndTime(date, time) {
  if (!date || !time) return null;
  const combined = new Date(`${date}T${time}:00`);
  return Number.isNaN(combined.getTime()) ? null : combined;
}

/**
 * "Reserve" for one store's offer of one product. Self-contained, the same
 * way RequestProduct.jsx owns its whole request flow: the sign-in prompt,
 * the pickup-window picker, and the success confirmation all live here so
 * StoreOffer only has to render this where the price already is.
 *
 * Not available at all when the offer itself is not reservable -- see
 * ReserveControl.isReservationEligible below, used by the caller to decide
 * whether to render this or nothing.
 */
export default function ReserveControl({ offer, product }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const mutation = useCreateReservation();

  const [stage, setStage] = useState(null); // null | "sign-in" | "pickup" | "success"
  const [pickupDate, setPickupDate] = useState(todayLocalDate);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [formError, setFormError] = useState("");
  const [copied, setCopied] = useState(false);
  const [reservation, setReservation] = useState(null);

  const isOutOfStock = !offer.is_reservable;

  const openFlow = () => {
    setFormError("");
    if (!isAuthenticated) {
      setStage("sign-in");
      return;
    }
    setStage("pickup");
  };

  const goToSignIn = () => {
    setStage(null);
    navigate("/login", { state: { from: `${routerLocation.pathname}${routerLocation.search}` } });
  };

  const start = combineDateAndTime(pickupDate, fromTime);
  const end = combineDateAndTime(pickupDate, toTime);
  const validUntilPreview = start && end && end > start ? new Date(end.getTime() + EXPIRY_BUFFER_MS) : null;

  const submit = (event) => {
    event.preventDefault();
    setFormError("");

    if (!start || !end) {
      setFormError("Choose a pickup date and both times.");
      return;
    }
    if (start >= end) {
      setFormError("The pickup start time must be before the end time.");
      return;
    }
    if (end.getTime() <= Date.now()) {
      setFormError("Pick a pickup window that hasn't already passed.");
      return;
    }
    if ((end.getTime() - start.getTime()) / (60 * 60 * 1000) > MAX_WINDOW_HOURS) {
      setFormError(`Pickup windows can be at most ${MAX_WINDOW_HOURS} hours long.`);
      return;
    }

    mutation.mutate(
      {
        storeProductId: offer.store_product_id,
        quantity: 1,
        pickupWindowStart: start.toISOString(),
        pickupWindowEnd: end.toISOString(),
      },
      {
        onSuccess: (data) => {
          setReservation(data);
          setCopied(false);
          setStage("success");
        },
        onError: (error) => {
          setFormError(error?.message ?? "Could not create this reservation. Please try again.");
        },
      },
    );
  };

  const closeAll = () => {
    setStage(null);
    setFormError("");
    setFromTime("");
    setToTime("");
  };

  const copyCode = async () => {
    if (!reservation?.reservation_code) return;
    try {
      await navigator.clipboard.writeText(reservation.reservation_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the code is already big and
      // selectable on screen, so this is a nice-to-have, not a blocker.
    }
  };

  return (
    <>
      {isOutOfStock ? (
        // The wrapping span (not the button itself) carries the tooltip: the
        // button's own disabled state pairs with a pointer-events-none class
        // (see Button.jsx), which would otherwise block the hover needed to
        // ever show a title on the button directly.
        <span title="This store hasn't shared an exact stock count for this item, so it can't be held for pickup.">
          <Button variant="secondary" size="sm" disabled>
            <PackageX className="size-4" aria-hidden="true" />
            Reservation Unavailable
          </Button>
        </span>
      ) : (
        <Button variant="secondary" size="sm" onClick={openFlow}>
          <Bookmark className="size-4" aria-hidden="true" />
          Reserve
        </Button>
      )}

      <Modal open={stage === "sign-in"} onClose={() => setStage(null)} title="Sign in to reserve this item" icon={LogIn}>
        <p className="text-body text-ink-soft">
          Account details are needed to hold this item under your name and to show you your reservation code.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStage(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={goToSignIn}>
            Sign in
          </Button>
        </div>
      </Modal>

      <Modal open={stage === "pickup"} onClose={closeAll} title="Choose when you can pick it up" icon={Bookmark}>
        <p className="text-meta text-ink-muted">
          Reserve it while you make your way to the store. We'll keep the item reserved until 1 hour after your
          selected pickup window.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-meta font-semibold text-ink-soft">Pickup date</span>
            <input
              type="date"
              required
              value={pickupDate}
              min={todayLocalDate()}
              onChange={(event) => setPickupDate(event.target.value)}
              className="mt-1 h-11 w-full rounded-control border border-line bg-surface px-3 text-meta text-ink focus:border-primary focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-meta font-semibold text-ink-soft">From</span>
              <input
                type="time"
                required
                value={fromTime}
                onChange={(event) => setFromTime(event.target.value)}
                className="mt-1 h-11 w-full rounded-control border border-line bg-surface px-3 text-meta text-ink focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-meta font-semibold text-ink-soft">To</span>
              <input
                type="time"
                required
                value={toTime}
                onChange={(event) => setToTime(event.target.value)}
                className="mt-1 h-11 w-full rounded-control border border-line bg-surface px-3 text-meta text-ink focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          {validUntilPreview ? (
            <p className="text-meta text-ink-muted">
              We'll keep it reserved until{" "}
              <span className="font-semibold text-ink">{formatReservationDateTime(validUntilPreview)}</span>.
            </p>
          ) : null}

          {formError ? <Alert tone="error">{formError}</Alert> : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={closeAll} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={mutation.isPending}>
              Confirm reservation
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={stage === "success"} onClose={closeAll} className="max-w-md" title="Reservation confirmed">
        {reservation ? (
          <div className="-mt-2 text-center">
            <SuccessTick className="mx-auto" />
            <p className="mt-3 text-card text-ink">Product reserved</p>

            <div className="mt-3 flex items-center justify-center gap-2">
              <p className="font-mono text-3xl font-black tracking-wide text-primary">
                {reservation.reservation_code}
              </p>
              <button
                type="button"
                onClick={copyCode}
                aria-label="Copy reservation code"
                className="inline-flex size-8 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                {copied ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              </button>
            </div>
            <p className="text-meta text-ink-muted">Reservation code</p>

            <div className="mt-5 rounded-card border border-line bg-canvas p-4 text-left">
              <p className="text-card text-ink">{product?.name}</p>
              {product?.unit_label ? <p className="text-meta text-ink-muted">{product.unit_label}</p> : null}
              <p className="mt-2 text-meta font-semibold text-ink">{reservation.store?.name}</p>
              {reservation.store?.address_line_1 ? (
                <p className="text-meta text-ink-muted">
                  {[reservation.store.address_line_1, reservation.store.locality, reservation.store.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}

              <div className="mt-3 border-t border-line-soft pt-3">
                <p className="text-meta text-ink-muted">
                  Pickup{" "}
                  <span className="font-semibold text-ink">
                    {formatPickupWindow(reservation.pickup_window_start, reservation.pickup_window_end)}
                  </span>
                </p>
                <p className="mt-1 text-meta text-ink-muted">
                  Reserved until{" "}
                  <span className="font-semibold text-ink">{formatReservationDateTime(reservation.expires_at)}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button as="a" href={directionsUrl(reservation.store)} target="_blank" rel="noopener noreferrer">
                <Navigation className="size-4" aria-hidden="true" />
                Get directions
              </Button>
              <Button variant="secondary" onClick={closeAll}>
                Done
              </Button>
            </div>

            <ReleaseFromSuccess reservationId={reservation.id} onReleased={closeAll} />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

/**
 * "Can't make it?" lives inside the success panel too, not just My
 * Reservations, so a customer who immediately realises they can't make it
 * never has to go hunting for the code they were just handed.
 */
function ReleaseFromSuccess({ reservationId, onReleased }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const cancelMutation = useCancelReservation();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-4 text-meta font-semibold text-ink-muted underline-offset-2 hover:text-ink hover:underline"
      >
        Can't make it? Release reservation
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-card border border-line bg-canvas p-3 text-left">
      <p className="text-meta text-ink-soft">
        Release this reservation so another customer can find the product.
      </p>
      {error ? <Alert tone="error" className="mt-2">{error}</Alert> : null}
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Keep it
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isLoading={cancelMutation.isPending}
          onClick={() => {
            cancelMutation.mutate(reservationId, {
              onSuccess: onReleased,
              onError: (err) => setError(err?.message ?? "Could not release this reservation."),
            });
          }}
        >
          Release it
        </Button>
      </div>
    </div>
  );
}
