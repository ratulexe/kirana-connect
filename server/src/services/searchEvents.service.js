import { getServiceClient } from "../config/supabase.js";
import { httpError } from "../utils/httpError.js";

// Coarsened to 3 decimal places (~111 m) so a search event can never be
// traced back to a customer's exact household location. Enforced again by
// the location_lat/lng numeric(6,3) columns themselves, not just here.
const LOCATION_PRECISION = 3;

function coarsen(value) {
  if (value === null) return null;
  return Number(value.toFixed(LOCATION_PRECISION));
}

function failed(operation, error) {
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}.`);
}

/**
 * Records one completed Consumer search for future unmet-demand analysis.
 * Anonymous by design: no user_id, no session, nothing that identifies a
 * person. Called from a route that is itself fire-and-forget from the
 * frontend's point of view, so a thrown error here reaches the client but is
 * never awaited or acted on -- it cannot block or break the search results
 * the customer already has.
 */
export async function recordSearchEvent(payload) {
  const client = getServiceClient();
  const { data, error } = await client
    .from("consumer_search_events")
    .insert({
      search_query: payload.search_query,
      normalized_query: payload.normalized_query,
      product_id: payload.product_id,
      category_id: payload.category_id,
      result_count: payload.result_count,
      available_store_count: payload.available_store_count,
      radius_km: payload.radius_km,
      location_lat: coarsen(payload.location_lat),
      location_lng: coarsen(payload.location_lng),
    })
    .select("id, created_at")
    .single();

  if (error) throw failed("record search event", error);
  return data;
}
