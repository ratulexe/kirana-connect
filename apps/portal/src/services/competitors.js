import { apiGet } from "../lib/apiBase.js";

/**
 * Fetches the hybrid competitor dataset (Kirana Connect + OpenStreetMap)
 * for a resolved location, category and radius.
 */
export async function fetchCompetitors({ latitude, longitude, radiusKm, categorySlug, signal }) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radiusKm: String(radiusKm),
    category: categorySlug,
  });
  return apiGet(`/api/entrepreneur/competitors?${params.toString()}`, { signal });
}
