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

/**
 * Walking-scale distances read better in metres below a kilometre.
 */
export function formatDistance(km) {
  const value = Number(km);
  if (!Number.isFinite(value)) return "";
  if (value < 1) return `${Math.round(value * 1000)} m`;
  return `${value.toFixed(1)} km`;
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
