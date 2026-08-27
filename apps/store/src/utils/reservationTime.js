/**
 * Reservation times are always rendered in Asia/Kolkata regardless of the
 * viewer's own device timezone -- a store owner checking a pickup window
 * must see the same time the customer agreed to. Mirrors the Consumer app's
 * src/utils/reservationTime.js; each Vite app in this repo keeps its own
 * small utils rather than sharing a package, same as format.js already does
 * here.
 */
const TIME_ZONE = "Asia/Kolkata";

const TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TIME_ZONE,
});

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TIME_ZONE,
});

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatReservationDateTime(value) {
  const date = toDate(value);
  return date ? DATE_TIME_FORMAT.format(date) : "";
}

export function formatPickupWindow(startIso, endIso) {
  const start = toDate(startIso);
  const end = toDate(endIso);
  if (!start || !end) return "";

  const sameDay = DATE_FORMAT.format(start) === DATE_FORMAT.format(end);
  if (sameDay) {
    return `${TIME_FORMAT.format(start)} - ${TIME_FORMAT.format(end)}`;
  }
  return `${DATE_TIME_FORMAT.format(start)} - ${DATE_TIME_FORMAT.format(end)}`;
}
