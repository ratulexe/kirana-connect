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

const SHORT_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * Formats an ISO `YYYY-MM-DD` (Postgres `date`) as e.g. "28 Aug". Forced to
 * UTC so the calendar date read out never shifts a day against the reader's
 * local timezone.
 */
export function formatShortDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate ?? ""));
  if (!match) return "";
  const [, year, month, day] = match;
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return SHORT_DATE.format(utcDate);
}

/** Today as YYYY-MM-DD in the reader's local timezone, for <input type="date"> comparisons. */
export function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
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
