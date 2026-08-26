import { apiGet } from "../lib/apiBase.js";

/** Fetches observed local retail-price data for the mapped product categories. */
export async function fetchPriceIntelligence({ latitude, longitude, radiusKm, categorySlug, signal }) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radiusKm: String(radiusKm),
    category: categorySlug,
  });
  return apiGet(`/api/entrepreneur/price-intelligence?${params.toString()}`, { signal });
}
