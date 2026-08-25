import { CalendarClock } from "lucide-react";
import Badge from "./Badge.jsx";
import { formatShortDate } from "../../utils/format.js";

// Public offers never carry expiry_status "expired" -- the backend excludes
// expired inventory before it reaches this component. This only has to
// render the states a customer can actually be shown.
const TONES = {
  expiring_soon: "warning",
  expires_today: "warning",
  valid: "neutral",
  unknown: "neutral",
};

/**
 * Best-before / expiry info for one store's offer. Wording is deliberately
 * factual ("Best before", "Expiry not provided") -- expiry is whatever the
 * store entered, never a platform-verified freshness claim.
 */
export default function ExpiryBadge({ expiryStatus, daysUntilExpiry, expiryDate, className }) {
  let label;
  switch (expiryStatus) {
    case "expires_today":
      label = "Expires today";
      break;
    case "expiring_soon":
      label = `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`;
      break;
    case "valid":
      label = `Best before ${formatShortDate(expiryDate)}`;
      break;
    default:
      label = "Expiry not provided";
  }

  return (
    <Badge tone={TONES[expiryStatus] ?? "neutral"} icon={CalendarClock} className={className}>
      {label}
    </Badge>
  );
}
