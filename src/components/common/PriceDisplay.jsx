import { cn } from "../../lib/cn.js";
import { formatPrice } from "../../utils/format.js";

const SIZES = {
  sm: { price: "text-[1.0625rem]", strike: "text-meta" },
  md: { price: "text-[1.375rem]", strike: "text-[0.875rem]" },
  lg: { price: "text-[1.75rem]", strike: "text-[0.9375rem]" },
};

/**
 * A store's price for a product, optionally struck through against a
 * reference price.
 *
 * Two independent sources can produce that reference:
 *   - the product's printed MRP, when the store's price is genuinely below it
 *   - the store's own advertised discount_percentage, in which case `price`
 *     is treated as the pre-offer price and the percentage is applied to get
 *     what the customer actually pays
 * The discount percentage wins when both are present, since it is the number
 * the store deliberately set to advertise this offer.
 *
 * Deliberately data-free: it formats whatever it is handed and computes the
 * saving itself, so no demo price ever lives inside the component.
 */
export default function PriceDisplay({
  price,
  mrp,
  discountPercentage,
  size = "md",
  showSavings = true,
  className,
}) {
  const listedPrice = Number(price);
  if (!Number.isFinite(listedPrice)) return null;

  const discountPct = Number(discountPercentage);
  const hasDiscount = Number.isFinite(discountPct) && discountPct > 0 && discountPct < 100;

  const printedPrice = Number(mrp);
  const hasMrp = !hasDiscount && Number.isFinite(printedPrice) && printedPrice > listedPrice;

  // Rounded to paise: a store's price is a currency amount, never a raw float.
  const finalPrice = hasDiscount
    ? Math.round(listedPrice * (1 - discountPct / 100) * 100) / 100
    : listedPrice;
  const referencePrice = hasDiscount ? listedPrice : hasMrp ? printedPrice : null;
  const savings = referencePrice !== null ? referencePrice - finalPrice : 0;
  const scale = SIZES[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-bold tracking-tight text-ink tabular-nums", scale.price)}>
        {formatPrice(finalPrice)}
      </span>

      {referencePrice !== null ? (
        <span className={cn("text-ink-muted line-through tabular-nums", scale.strike)}>
          {formatPrice(referencePrice)}
        </span>
      ) : null}

      {referencePrice !== null && showSavings ? (
        <span className={cn("font-semibold text-success tabular-nums", scale.strike)}>
          Save {formatPrice(savings)}
        </span>
      ) : null}
    </div>
  );
}
