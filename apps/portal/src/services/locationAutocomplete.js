import { apiGet } from "../lib/apiBase.js";

/**
 * Search-as-you-type location suggestions, via the Kirana Connect backend's
 * configured autocomplete provider -- never called against Nominatim
 * directly (its public-instance usage policy does not permit autocomplete
 * traffic; that integration stays reserved for explicit final-submit
 * resolution in entrepreneurLocation.js).
 */
export async function fetchLocationSuggestions(query, { signal } = {}) {
  const params = new URLSearchParams({ q: query, limit: "6" });
  return apiGet(`/api/entrepreneur/location-suggestions?${params.toString()}`, { signal });
}
