import { badRequest } from "./httpError.js";

/**
 * Server-side validation for store onboarding.
 *
 * The browser validates the same rules with Zod for good UX, but that is a
 * convenience, not a control: anything reaching this endpoint may have been
 * crafted by hand. These rules mirror the CHECK constraints in the schema so a
 * bad payload fails here with a readable message instead of surfacing a raw
 * database constraint error.
 *
 * Fields the client is never allowed to influence - owner_id, is_verified,
 * role, slug, id - are simply not read out of the body.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{6,20}$/;

function text(value, field, { required = false, min = 1, max = 200 } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest(`${field} is required.`);
    return null;
  }

  if (typeof value !== "string") throw badRequest(`${field} must be text.`);

  const trimmed = value.trim();
  if (trimmed === "") {
    if (required) throw badRequest(`${field} is required.`);
    return null;
  }
  if (trimmed.length < min) throw badRequest(`${field} must be at least ${min} characters.`);
  if (trimmed.length > max) throw badRequest(`${field} must be at most ${max} characters.`);

  return trimmed;
}

function phone(value, field, { required = false } = {}) {
  const trimmed = text(value, field, { required, min: 6, max: 20 });
  if (trimmed === null) return null;
  if (!PHONE_PATTERN.test(trimmed)) {
    throw badRequest(`${field} must be a valid phone number.`);
  }
  return trimmed;
}

function coordinate(value, field, { min, max }) {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw badRequest(`${field} must be a number.`);
  if (parsed < min || parsed > max) {
    throw badRequest(`${field} must be between ${min} and ${max}.`);
  }

  // numeric(9,6) in the schema; rounding here avoids a silent database error.
  return Math.round(parsed * 1e6) / 1e6;
}

function validateHours(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw badRequest("Opening hours must be a list.");
  if (value.length > 7) throw badRequest("Opening hours may contain at most seven days.");

  const seen = new Set();

  return value.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw badRequest("Each opening hours entry must be an object.");
    }

    const day = Number(entry.day_of_week);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw badRequest("day_of_week must be a whole number between 0 and 6.");
    }
    if (seen.has(day)) throw badRequest("Each day may appear only once in opening hours.");
    seen.add(day);

    const isClosed = entry.is_closed === true;

    if (isClosed) {
      // Matches store_hours_times_coherent: closed days carry no times.
      return { day_of_week: day, is_closed: true, opens_at: null, closes_at: null };
    }

    const opensAt = text(entry.opens_at, "Opening time", { required: true, max: 5 });
    const closesAt = text(entry.closes_at, "Closing time", { required: true, max: 5 });

    if (!TIME_PATTERN.test(opensAt) || !TIME_PATTERN.test(closesAt)) {
      throw badRequest("Opening and closing times must be in HH:MM format.");
    }
    if (opensAt === closesAt) {
      throw badRequest("Opening and closing times cannot be identical.");
    }

    return { day_of_week: day, is_closed: false, opens_at: opensAt, closes_at: closesAt };
  });
}

export function validateStoreRegistration(body) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("A store registration payload is required.");
  }

  const latitude = coordinate(body.latitude, "Latitude", { min: -90, max: 90 });
  const longitude = coordinate(body.longitude, "Longitude", { min: -180, max: 180 });

  // stores_coordinates_paired: half a coordinate is never useful.
  if ((latitude === null) !== (longitude === null)) {
    throw badRequest("Latitude and longitude must be provided together.");
  }

  const store = {
    name: text(body.name, "Store name", { required: true, min: 2, max: 120 }),
    description: text(body.description, "Description", { max: 500 }),
    phone: phone(body.phone, "Store phone"),
    address_line_1: text(body.address_line_1, "Address line 1", { required: true, max: 200 }),
    address_line_2: text(body.address_line_2, "Address line 2", { max: 200 }),
    locality: text(body.locality, "Locality", { required: true, max: 120 }),
    city: text(body.city, "City", { required: true, max: 120 }),
    state: text(body.state, "State", { required: true, max: 120 }),
    postal_code: text(body.postal_code, "Postal code", { required: true, min: 4, max: 12 }),
    latitude,
    longitude,
  };

  const owner = {
    full_name: text(body.owner_full_name, "Your name", { max: 120 }),
    phone: phone(body.owner_phone, "Your phone"),
  };

  return { store, owner, hours: validateHours(body.hours) };
}
