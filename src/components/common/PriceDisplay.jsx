import { cn } from "../../lib/cn.js";
import { formatPrice } from "../../utils/format.js";

const SIZES = {
  sm: { price: "text-[1.0625rem]", strike: "text-meta" },
  md: { price: "text-[1.375rem]", strike: "text-[0.875rem]" },
  lg: { price: "text-[1.75rem]", strike: "text-[0.9375rem]" },
};

/**
 * A store's price for a product, optionally against the printed MRP.
 *
 * Deliberately data-free: it formats whatever it is handed and computes the
 * saving itself, so no demo price ever lives inside the component.
 */
export default function PriceDisplay({
  price,
  mrp,
  size = "md",
  showSavings = true,
  className,
}) {
  const sellingPrice = Number(price);
  if (!Number.isFinite(sellingPrice)) return null;

  const printedPrice = Number(mrp);
  const hasMrp = Number.isFinite(printedPrice) && printedPrice > sellingPrice;
  const savings = hasMrp ? printedPrice - sellingPrice : 0;
  const scale = SIZES[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-bold tracking-tight text-ink tabular-nums", scale.price)}>
        {formatPrice(sellingPrice)}
      </span>

      {hasMrp ? (
        <span className={cn("text-ink-muted line-through tabular-nums", scale.strike)}>
          {formatPrice(printedPrice)}
        </span>
      ) : null}

      {hasMrp && showSavings ? (
        <span className={cn("font-semibold text-success tabular-nums", scale.strike)}>
          Save {formatPrice(savings)}
        </span>
      ) : null}
    </div>
  );
}
