import { apiGet } from "../lib/apiBase.js";

/**
 * Resolves a free-text place into real candidate coordinates via the
 * backend's LocationProvider (Portal -> Backend -> Nominatim). Only ever
 * called after an intentional action (Analyse Opportunity / Find Location),
 * never on keystroke -- there is no debounced autocomplete call anywhere in
 * this file.
 */
export async function fetchLocationCandidates(query, { signal } = {}) {
  const data = await apiGet(`/api/entrepreneur/location-candidates?q=${encodeURIComponent(query)}`, { signal });
  return data.candidates;
}
