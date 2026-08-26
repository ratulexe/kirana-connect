import { apiGet } from "../lib/apiBase.js";

/** Fetches the Demand-Supply Gap analysis for a resolved location, category and radius. */
export async function fetchDemandSupply({ latitude, longitude, radiusKm, categorySlug, signal }) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radiusKm: String(radiusKm),
    category: categorySlug,
  });
  return apiGet(`/api/entrepreneur/demand-supply?${params.toString()}`, { signal });
}
