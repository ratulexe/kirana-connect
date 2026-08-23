import { TrendingDown } from "lucide-react";
import Badge from "./Badge.jsx";

/**
 * Savings against a product's printed MRP.
 *
 * Renders nothing when there is nothing to celebrate, so callers can drop it in
 * unconditionally without guarding every usage.
 */
export default function DiscountBadge({ percentage, className }) {
  const value = Number(percentage);
  if (!Number.isFinite(value) || value <= 0) return null;

  return (
    <Badge tone="accent" icon={TrendingDown} className={className}>
      {Math.round(value)}% off MRP
    </Badge>
  );
}
