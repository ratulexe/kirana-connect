import { badRequest } from "./httpError.js";

// Hand-rolled parsing rather than a validation library, to keep the backend
// dependency list to express, cors, dotenv and the Supabase client.

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 50;
export const RADIUS_KM_DEFAULT = 5;
export const RADIUS_KM_MAX = 50;

/**
 * Trimmed string, or null when absent or blank.
 */
export function optionalString(value, { field, maxLength = 120 } = {}) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw badRequest(`${field} must be a single value`);
  }

  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed.length > maxLength) {
    throw badRequest(`${field} must be at most ${maxLength} characters`);
  }

  return trimmed;
}

export function requiredNumber(value, { field, min, max }) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`${field} is required`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw badRequest(`${field} must be a number`);
  }
  if (parsed < min || parsed > max) {
    throw badRequest(`${field} must be between ${min} and ${max}`);
  }

  return parsed;
}

export function optionalNumber(value, { field, min, max, fallback }) {
  if (value === undefined || value === null || value === "") return fallback;
  return requiredNumber(value, { field, min, max });
}

export function optionalInteger(value, { field, min, max, fallback }) {
  if (value === undefined || value === null || value === "") return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw badRequest(`${field} must be a whole number`);
  }
  if (parsed < min || parsed > max) {
    throw badRequest(`${field} must be between ${min} and ${max}`);
  }

  return parsed;
}

/**
 * limit / offset shared by every list endpoint.
 */
export function parsePagination(query) {
  return {
    limit: optionalInteger(query.limit, {
      field: "limit",
      min: 1,
      max: PAGE_SIZE_MAX,
      fallback: PAGE_SIZE_DEFAULT,
    }),
    offset: optionalInteger(query.offset, {
      field: "offset",
      min: 0,
      max: 10000,
      fallback: 0,
    }),
  };
}

/**
 * The customer's position and how far they are willing to walk or ride.
 */
export function parseLocation(query, { required = true } = {}) {
  const hasLat = query.lat !== undefined && query.lat !== "";
  const hasLng = query.lng !== undefined && query.lng !== "";

  if (!required && !hasLat && !hasLng) return null;

  if (hasLat !== hasLng) {
    throw badRequest("lat and lng must be supplied together");
  }

  return {
    lat: requiredNumber(query.lat, { field: "lat", min: -90, max: 90 }),
    lng: requiredNumber(query.lng, { field: "lng", min: -180, max: 180 }),
    radiusKm: optionalNumber(query.radius, {
      field: "radius",
      min: 0.1,
      max: RADIUS_KM_MAX,
      fallback: RADIUS_KM_DEFAULT,
    }),
  };
}

/**
 * PostgREST treats %, _ and , as special inside ilike patterns.
 */
export function escapeLikePattern(term) {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}
