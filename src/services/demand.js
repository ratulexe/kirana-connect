import { apiPost } from "../lib/api.js";

/**
 * Records a signed-in customer's interest in a product variant that no
 * nearby store currently carries. Requires an authenticated session; the
 * backend derives the customer from the bearer token, never from this body.
 */
export async function createDemandRequest({ productVariantId, latitude, longitude, radiusKm }) {
  const { data } = await apiPost("/demand-requests", {
    product_variant_id: productVariantId,
    latitude,
    longitude,
    radius_km: radiusKm,
  });
  return data;
}
