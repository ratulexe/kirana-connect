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
