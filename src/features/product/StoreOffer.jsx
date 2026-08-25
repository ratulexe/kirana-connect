import { MapPin, Navigation, Phone, Sparkles } from "lucide-react";
import Badge from "../../components/common/Badge.jsx";
import StockBadge from "../../components/common/StockBadge.jsx";
import DiscountBadge from "../../components/common/DiscountBadge.jsx";
import ExpiryBadge from "../../components/common/ExpiryBadge.jsx";
import PriceDisplay from "../../components/common/PriceDisplay.jsx";
import Button from "../../components/common/Button.jsx";
import { formatDistance } from "../../utils/format.js";
import { directionsUrl } from "../../utils/directions.js";

/**
 * One shop's offer for a product: the row the whole application exists to show.
 *
 * The cheapest offer is marked rather than merely being first, because the list
 * can also be sorted by distance, and "first" would then quietly mean something
 * different.
 */
export default function StoreOffer({ offer, mrp }) {
  const { store } = offer;

  return (
    <li className="flex flex-wrap items-start justify-between gap-x-5 gap-y-4 px-4 py-5 sm:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-card text-ink">{store.name}</h3>
          {offer.is_cheapest ? (
            <Badge tone="primary" icon={Sparkles}>
              Lowest price
            </Badge>
          ) : null}
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {store.locality}, {store.city}
          </span>
          {offer.distance_km !== null ? (
            <>
              <span aria-hidden="true">&middot;</span>
              <span className="font-semibold text-ink-soft">
                {formatDistance(offer.distance_km)} away
              </span>
            </>
          ) : null}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <StockBadge status={offer.stock_status} />
          <DiscountBadge percentage={offer.discount_percentage} />
          <ExpiryBadge
            expiryStatus={offer.expiry_status}
            daysUntilExpiry={offer.days_until_expiry}
            expiryDate={offer.expiry_date}
          />
        </div>

        {store.phone ? (
          <p className="mt-2.5 text-meta text-ink-muted">
            <a
              href={`tel:${store.phone}`}
              className="inline-flex items-center gap-1.5 rounded-control py-0.5 font-semibold text-ink-soft underline-offset-4 hover:underline"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              {store.phone}
            </a>
            <span className="ml-1">to check before you go</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        <PriceDisplay price={offer.selling_price} mrp={mrp} size="md" />

        <Button
          as="a"
          href={directionsUrl(store)}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
        >
          <Navigation className="size-4" aria-hidden="true" />
          Go to store
        </Button>
      </div>
    </li>
  );
}
