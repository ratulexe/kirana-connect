import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookmarkCheck, Navigation, PackageSearch } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";
import Alert from "../../components/common/Alert.jsx";
import { useAuth } from "../../auth/useAuth.js";
import { useMyReservations, useCancelReservation } from "../../hooks/useReservations.js";
import { directionsUrl } from "../../utils/directions.js";
import { formatPickupWindow, formatReservationDateTime } from "../../utils/reservationTime.js";

const STATUS_STYLE = {
  active: "bg-success-soft text-success",
  collected: "bg-primary-soft text-primary",
  cancelled: "bg-surface-sunken text-ink-muted",
  expired: "bg-warning-soft text-warning",
};

const STATUS_LABEL = {
  active: "Active",
  collected: "Collected",
  cancelled: "Cancelled",
  expired: "Expired",
};

function ReleaseControl({ reservationId }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const cancelMutation = useCancelReservation();

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Cancel / release
      </Button>
    );
  }

  return (
    <div className="mt-2 rounded-control border border-line bg-canvas p-3">
      <p className="text-meta text-ink-soft">
        Can't make it? Release this reservation so another customer can find the product.
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
          onClick={() =>
            cancelMutation.mutate(reservationId, {
              onError: (err) => setError(err?.message ?? "Could not release this reservation."),
            })
          }
        >
          Release it
        </Button>
      </div>
    </div>
  );
}

function ReservationCard({ reservation }) {
  const isActive = reservation.status === "active";
  const isExpired = reservation.status === "expired";

  return (
    <li className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-control border border-line-soft bg-canvas">
        {reservation.product?.image_url ? (
          <img src={reservation.product.image_url} alt="" className="size-full object-contain p-1.5" loading="lazy" />
        ) : (
          <PackageSearch className="size-6 text-ink-muted" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-card text-ink">{reservation.product?.name ?? "Product"}</p>
          <span className={`rounded-pill px-2 py-0.5 text-[0.7rem] font-bold ${STATUS_STYLE[reservation.status] ?? ""}`}>
            {STATUS_LABEL[reservation.status] ?? reservation.status}
          </span>
        </div>
        {reservation.product?.unit_label ? (
          <p className="text-meta text-ink-muted">{reservation.product.unit_label}</p>
        ) : null}
        <p className="mt-1 text-meta font-semibold text-ink-soft">{reservation.store?.name}</p>

        <p className="mt-2 font-mono text-lg font-black tracking-wide text-primary">{reservation.reservation_code}</p>

        <p className="mt-1 text-meta text-ink-muted">
          Pickup <span className="font-semibold text-ink">{formatPickupWindow(reservation.pickup_window_start, reservation.pickup_window_end)}</span>
        </p>
        {isActive ? (
          <p className="text-meta text-ink-muted">
            Valid until <span className="font-semibold text-ink">{formatReservationDateTime(reservation.expires_at)}</span>
          </p>
        ) : null}
        {isExpired ? (
          <p className="mt-1 text-meta text-ink-muted">
            This reservation expired and the item has been released for other customers.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isActive ? (
            <Button as="a" href={directionsUrl(reservation.store)} target="_blank" rel="noopener noreferrer" size="sm">
              <Navigation className="size-4" aria-hidden="true" />
              Directions
            </Button>
          ) : null}
          {isActive ? <ReleaseControl reservationId={reservation.id} /> : null}
        </div>
      </div>
    </li>
  );
}

function ReservationsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-32 rounded-card" />
      ))}
    </div>
  );
}

export default function ReservedPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const reservations = useMyReservations({ enabled: isAuthenticated });

  const { active, history } = useMemo(() => {
    const list = reservations.data ?? [];
    return {
      active: list.filter((r) => r.status === "active"),
      history: list.filter((r) => r.status !== "active"),
    };
  }, [reservations.data]);

  if (!authLoading && !isAuthenticated) {
    return (
      <Container className="py-12 sm:py-16">
        <EmptyState
          icon={BookmarkCheck}
          title="Sign in to see your reservations"
          description="Your reservation codes and pickup windows live here once you're signed in."
          action={<Button as={Link} to="/login" state={{ from: "/reserved" }}>Sign in</Button>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="flex items-center gap-2.5 text-heading text-ink">
        <BookmarkCheck className="size-6 text-primary" aria-hidden="true" />
        My reservations
      </h1>
      <p className="mt-1 text-meta text-ink-muted">
        Your reservation codes and pickup windows, in one place.
      </p>

      <div className="mt-6" aria-busy={reservations.isPending}>
        {reservations.isPending ? <ReservationsSkeleton /> : null}

        {reservations.isError ? (
          <EmptyState
            tone="error"
            icon={PackageSearch}
            title="Could not load your reservations"
            description={reservations.error?.message ?? "Please try again in a moment."}
          />
        ) : null}

        {!reservations.isPending && !reservations.isError && active.length === 0 && history.length === 0 ? (
          <EmptyState
            icon={BookmarkCheck}
            title="No reservations yet"
            description="When you reserve a product at a nearby store, it shows up here with a pickup code."
            action={<Button as={Link} to="/search">Browse products</Button>}
          />
        ) : null}

        {active.length > 0 ? (
          <section aria-labelledby="active-reservations-heading">
            <h2 id="active-reservations-heading" className="text-section text-ink">
              Active
            </h2>
            <ul className="mt-3 space-y-3">
              {active.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          </section>
        ) : null}

        {history.length > 0 ? (
          <section aria-labelledby="reservation-history-heading" className={active.length > 0 ? "mt-8" : ""}>
            <h2 id="reservation-history-heading" className="text-section text-ink">
              History
            </h2>
            <ul className="mt-3 space-y-3">
              {history.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
