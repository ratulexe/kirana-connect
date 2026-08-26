import { apiGet } from "../lib/apiBase.js";

/** Fetches geographic market reach (area, population if available, typical channels). */
export async function fetchMarketReach({ latitude, longitude, radiusKm, categorySlug, signal }) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radiusKm: String(radiusKm),
    category: categorySlug,
  });
  return apiGet(`/api/entrepreneur/market-reach?${params.toString()}`, { signal });
}
