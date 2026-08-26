import { badRequest } from "./httpError.js";
import { optionalNumber, optionalString, requiredNumber } from "./queryParams.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalUuid(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !UUID.test(value)) {
    throw badRequest(`${field} must be a valid id.`);
  }
  return value;
}

function optionalNonNegativeInteger(value, field) {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw badRequest(`${field} must be a non-negative whole number.`);
  }
  return parsed;
}

/**
 * Payload for logging one completed Consumer search. Deliberately narrow and
 * anonymous: no user identity is accepted or expected here. product_id and
 * category_id are trusted from the same-origin app (it already holds the
 * exact result set that made the match unambiguous); re-deriving them here
 * would mean re-running the search query this event is describing, which is
 * exactly the duplicate work this instrumentation is meant to avoid.
 */
export function validateSearchEventCreate(body) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("A search event payload is required.");
  }

  const searchQuery = optionalString(body.search_query, { field: "search_query", maxLength: 200 });
  if (!searchQuery) {
    throw badRequest("search_query is required.");
  }

  const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalizedQuery) {
    throw badRequest("search_query must contain visible text.");
  }

  const resultCount = optionalNonNegativeInteger(body.result_count, "result_count");
  if (resultCount === null) {
    throw badRequest("result_count is required.");
  }

  const hasLat = body.lat !== undefined && body.lat !== null && body.lat !== "";
  const hasLng = body.lng !== undefined && body.lng !== null && body.lng !== "";
  if (hasLat !== hasLng) {
    throw badRequest("lat and lng must be supplied together.");
  }

  return {
    search_query: searchQuery,
    normalized_query: normalizedQuery,
    result_count: resultCount,
    available_store_count: optionalNonNegativeInteger(body.available_store_count, "available_store_count"),
    radius_km: optionalNumber(body.radius_km, { field: "radius_km", min: 0, max: 50, fallback: null }),
    location_lat: hasLat ? requiredNumber(body.lat, { field: "lat", min: -90, max: 90 }) : null,
    location_lng: hasLng ? requiredNumber(body.lng, { field: "lng", min: -180, max: 180 }) : null,
    product_id: optionalUuid(body.product_id, "product_id"),
    category_id: optionalUuid(body.category_id, "category_id"),
  };
}
