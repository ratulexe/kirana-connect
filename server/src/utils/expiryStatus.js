/**
 * Derives expiry status from a store inventory row's expiry_date.
 *
 * expiry_date is a PostgreSQL `date` (calendar day, no time-of-day), so this
 * works entirely in whole calendar days and never routes through a
 * timezone-sensitive Date parse of the stored value -- that is what would let
 * an expiry silently move a day backward/forward. Both the stored date and
 * "today" are reduced to plain Y/M/D integers before comparing.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function dateOnlyUtc(year, monthIndex, day) {
  return Date.UTC(year, monthIndex, day);
}

/**
 * Parses a `YYYY-MM-DD` string (what Supabase returns for a `date` column)
 * into UTC day components, without ever constructing a Date from the string
 * itself.
 */
function parseIsoDateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const utc = dateOnlyUtc(year, monthIndex, day);

  // Reject impossible calendar dates such as 2026-02-30, which Date.UTC would
  // otherwise silently roll forward into March.
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== monthIndex ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return utc;
}

/**
 * @param {string | null | undefined} expiryDate ISO `YYYY-MM-DD`, or null/undefined.
 * @param {Date} [referenceDate] Defaults to the server's current moment; only
 *   its local calendar day (Y/M/D) is used as "today".
 * @returns {{ status: "unknown"|"expired"|"expires_today"|"expiring_soon"|"valid", days_until_expiry: number|null }}
 */
export function getExpiryStatus(expiryDate, referenceDate = new Date()) {
  if (expiryDate === null || expiryDate === undefined || expiryDate === "") {
    return { status: "unknown", days_until_expiry: null };
  }

  const expiryUtc = parseIsoDateOnly(expiryDate);
  if (expiryUtc === null) {
    return { status: "unknown", days_until_expiry: null };
  }

  const todayUtc = dateOnlyUtc(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  const daysUntilExpiry = Math.round((expiryUtc - todayUtc) / DAY_MS);

  let status;
  if (daysUntilExpiry < 0) status = "expired";
  else if (daysUntilExpiry === 0) status = "expires_today";
  else if (daysUntilExpiry <= 3) status = "expiring_soon";
  else status = "valid";

  return { status, days_until_expiry: daysUntilExpiry };
}

export function isExpired(expiryDate, referenceDate = new Date()) {
  return getExpiryStatus(expiryDate, referenceDate).status === "expired";
}
