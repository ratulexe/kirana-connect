import { badRequest } from "./httpError.js";
import { uuidField } from "./validateInventory.js";

const MAX_QUANTITY = 10;
const MAX_WINDOW_HOURS = 6;
const EXPIRY_BUFFER_MS = 60 * 60 * 1000;

function parseTimestamp(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`${field} is required.`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw badRequest(`${field} must be a valid date/time.`);
  }
  return parsed;
}

/**
 * Validates the pickup window a customer picked and computes the one true
 * expiry: pickup_window_end + 1 hour. This is the only place that number is
 * computed on the write path -- the client never supplies expires_at, and
 * the create_reservation database function re-derives and re-checks the
 * same rule again before it will insert a row, so a client that bypassed
 * this layer entirely still cannot smuggle in a different expiry.
 */
export function validateReservationCreate(body) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("A reservation payload is required.");
  }

  const storeProductId = uuidField(body.store_product_id, "Inventory item");

  let quantity = 1;
  if (body.quantity !== undefined && body.quantity !== null && body.quantity !== "") {
    quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw badRequest("Quantity must be a positive whole number.");
    }
    if (quantity > MAX_QUANTITY) {
      throw badRequest(`Quantity cannot exceed ${MAX_QUANTITY}.`);
    }
  }

  const pickupStart = parseTimestamp(body.pickup_window_start, "Pickup start time");
  const pickupEnd = parseTimestamp(body.pickup_window_end, "Pickup end time");

  if (pickupStart >= pickupEnd) {
    throw badRequest("Pickup start time must be before the pickup end time.");
  }
  if (pickupEnd.getTime() <= Date.now()) {
    throw badRequest("Pickup window must be in the future.");
  }
  const windowHours = (pickupEnd.getTime() - pickupStart.getTime()) / (60 * 60 * 1000);
  if (windowHours > MAX_WINDOW_HOURS) {
    throw badRequest(`Pickup window cannot be longer than ${MAX_WINDOW_HOURS} hours.`);
  }

  const expiresAt = new Date(pickupEnd.getTime() + EXPIRY_BUFFER_MS);

  return {
    store_product_id: storeProductId,
    quantity,
    pickup_window_start: pickupStart.toISOString(),
    pickup_window_end: pickupEnd.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
}

export function reservationIdField(value) {
  return uuidField(value, "Reservation");
}

export function reservationCodeField(value) {
  const code = String(value ?? "").trim().toUpperCase();
  if (!/^KC-\d{4}$/.test(code)) {
    throw badRequest('Reservation code must look like "KC-0000".');
  }
  return code;
}
