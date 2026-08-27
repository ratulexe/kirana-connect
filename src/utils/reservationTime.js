/**
 * Reservation times are always rendered in Asia/Kolkata, regardless of the
 * viewer's own device timezone -- a store owner checking a pickup window
 * from a different timezone must see the same time the customer agreed to.
 * This project has no other timezone configuration to defer to (the
 * prototype is India-only), so this is the one place that is hard-coded,
 * per this feature's own spec.
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

export function formatReservationTime(value) {
  const date = toDate(value);
  return date ? TIME_FORMAT.format(date) : "";
}

export function formatReservationDate(value) {
  const date = toDate(value);
  return date ? DATE_FORMAT.format(date) : "";
}

export function formatReservationDateTime(value) {
  const date = toDate(value);
  return date ? DATE_TIME_FORMAT.format(date) : "";
}

/** "6:00 AM - 12:00 PM", collapsing to one date when both timestamps fall on the same IST calendar day. */
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
