import { badRequest } from "./httpError.js";
import { uuidField } from "./validateInventory.js";
import { requiredNumber } from "./queryParams.js";
import { RADIUS_KM_MAX } from "./queryParams.js";

/**
 * Payload for creating a demand request. Deliberately narrow: only what a
 * customer is allowed to assert about their own request. user_id, status and
 * timestamps are never accepted from the client -- user_id comes from the
 * verified token, everything else defaults sensibly in the database.
 */
export function validateDemandRequestCreate(body) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("A demand request payload is required.");
  }

  return {
    product_variant_id: uuidField(body.product_variant_id, "Product size"),
    latitude: requiredNumber(body.latitude, { field: "Latitude", min: -90, max: 90 }),
    longitude: requiredNumber(body.longitude, { field: "Longitude", min: -180, max: 180 }),
    radius_km: requiredNumber(body.radius_km, { field: "Search radius", min: 0.1, max: RADIUS_KM_MAX }),
  };
}
