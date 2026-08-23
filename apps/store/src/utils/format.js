/**
 * Rupee amount. Whole rupees drop the paise so a shelf price reads as "Rs 33"
 * rather than "Rs 33.00", while 31.5 still renders as "Rs 31.50".
 */
export function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";

  const fractionDigits = Number.isInteger(amount) ? 0 : 2;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** Relative time for "stock last updated", kept coarse on purpose. */
export function formatRelativeTime(value) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";

  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
