import { badRequest } from "./httpError.js";
import { optionalInteger, optionalString, requiredNumber } from "./queryParams.js";

const RADIUS_KM_MIN = 0.5;
const RADIUS_KM_MAX = 25;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DEMAND_PERIOD_DAYS_DEFAULT = 90;
const DEMAND_PERIOD_DAYS_MIN = 7;
const DEMAND_PERIOD_DAYS_MAX = 365;

function validateBusinessCategorySlug(query) {
  const category = optionalString(query.category, { field: "category", maxLength: 60 });
  if (!category) throw badRequest("category is required.");
  if (!SLUG.test(category)) throw badRequest("category must be a valid business category slug.");
  return category;
}

export function validateLocationQuery(query) {
  const q = optionalString(query.q, { field: "q", maxLength: 200 });
  if (!q) throw badRequest("q is required.");
  return q;
}

const LOCATION_SUGGEST_MIN_LENGTH = 2;
const LOCATION_SUGGEST_MAX_RESULTS = 7;

/**
 * The autocomplete endpoint's own, stricter validator: a short minimum
 * length (so a single keystroke never reaches the provider) and a hard
 * server-side cap on how many results can be requested, independent of
 * whatever the client asks for.
 */
export function validateLocationSuggestQuery(query) {
  const q = optionalString(query.q, { field: "q", maxLength: 200 });
  if (!q || q.length < LOCATION_SUGGEST_MIN_LENGTH) {
    throw badRequest(`q must be at least ${LOCATION_SUGGEST_MIN_LENGTH} characters.`);
  }

  const limit = optionalInteger(query.limit, {
    field: "limit",
    min: 1,
    max: LOCATION_SUGGEST_MAX_RESULTS,
    fallback: 6,
  });

  return { q, limit };
}

/**
 * Shared by the competitor-discovery endpoint. lat/lng/radius are checked
 * against real coordinate ranges, not just "is a number" -- these ultimately
 * drive both a Supabase bounding-box query and a paid-nowhere-but-rate-limited
 * external API call, so a garbage value must fail here, not downstream.
 */
export function validateCompetitorQuery(query) {
  const lat = requiredNumber(query.lat, { field: "lat", min: -90, max: 90 });
  const lng = requiredNumber(query.lng, { field: "lng", min: -180, max: 180 });
  const radiusKm = requiredNumber(query.radiusKm, { field: "radiusKm", min: RADIUS_KM_MIN, max: RADIUS_KM_MAX });
  const categorySlug = validateBusinessCategorySlug(query);

  return { lat, lng, radiusKm, categorySlug };
}

/**
 * Same coordinate/radius/category checks as the competitor endpoint, plus an
 * optional analysis window in days. The default (90) is not hard-coded at
 * every call site -- a future caller can pass a different window without
 * this validator changing, since the range check is generic.
 */
export function validateDemandSupplyQuery(query) {
  const lat = requiredNumber(query.lat, { field: "lat", min: -90, max: 90 });
  const lng = requiredNumber(query.lng, { field: "lng", min: -180, max: 180 });
  const radiusKm = requiredNumber(query.radiusKm, { field: "radiusKm", min: RADIUS_KM_MIN, max: RADIUS_KM_MAX });
  const categorySlug = validateBusinessCategorySlug(query);
  const days = optionalInteger(query.days, {
    field: "days",
    min: DEMAND_PERIOD_DAYS_MIN,
    max: DEMAND_PERIOD_DAYS_MAX,
    fallback: DEMAND_PERIOD_DAYS_DEFAULT,
  });

  return { lat, lng, radiusKm, categorySlug, days };
}
