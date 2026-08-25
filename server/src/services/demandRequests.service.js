import { getServiceClient, getPublicClient } from "../config/supabase.js";
import { httpError, notFoundError } from "../utils/httpError.js";
import { boundingBox, haversineKm } from "../utils/geo.js";
import { resolveOwnedStore } from "./inventory.service.js";

/**
 * Hyperlocal product demand: "I want this nearby, but no store has it."
 *
 * Two audiences, two very different views of the same table:
 *   - a customer creates and (implicitly) owns exactly one open row per
 *     variant they're missing
 *   - a store manager only ever sees an aggregate count for their own store's
 *     surroundings, never a customer's identity or exact location
 * Both paths run through the service role, exactly like store inventory: RLS
 * on the table is a backstop, not the primary mechanism.
 */

// Fixed "how far from a store do we call demand relevant". Kept separate from
// a customer's own requested search radius (which is about their willingness
// to travel, stored for future analytics) so every store sees a consistent,
// easy-to-explain number rather than a mix of whatever radius each customer
// happened to pick.
const STORE_DEMAND_RADIUS_KM = 5;

const VARIANT_DISPLAY_FIELDS = `
  id, unit_code, unit_label, mrp, image_url, is_active,
  product:products!inner (
    id, name, slug, image_url, is_active,
    category:categories (id, name, slug),
    brand:brands (id, name, slug)
  )
`;

function failed(operation, error) {
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

async function loadVariant(variantId) {
  const client = getServiceClient();
  const { data, error } = await client
    .from("product_variants")
    .select("id, product_id, is_active, product:products!inner (id, is_active)")
    .eq("id", variantId)
    .maybeSingle();

  if (error) throw failed("check that product size", error);
  if (!data) throw notFoundError("That product size is not in the catalogue.");
  if (!data.is_active || !data.product?.is_active) {
    throw httpError(409, "That product size is no longer available in the catalogue.");
  }
  return data;
}

/**
 * Whether at least one publicly eligible store already stocks this variant
 * within the customer's own radius -- the same rules (verified store, active
 * product, in-stock, not expired) that decide what a customer sees on the
 * product page, since this goes through the anon-key client and RLS.
 */
async function hasEligibleNearbySupply({ productVariantId, latitude, longitude, radiusKm }) {
  const client = getPublicClient();
  const box = boundingBox(latitude, longitude, radiusKm);

  const { data, error } = await client
    .from("store_products")
    .select("store:stores!inner (latitude, longitude)")
    .eq("product_variant_id", productVariantId)
    .gte("store.latitude", box.minLat)
    .lte("store.latitude", box.maxLat)
    .gte("store.longitude", box.minLng)
    .lte("store.longitude", box.maxLng);

  if (error) throw failed("check nearby availability", error);

  return (data ?? []).some((row) => {
    const store = row.store;
    if (store?.latitude == null || store?.longitude == null) return false;
    return haversineKm(latitude, longitude, Number(store.latitude), Number(store.longitude)) <= radiusKm;
  });
}

/**
 * Creates (or, if one is already open, idempotently returns) a customer's
 * demand request. user_id always comes from the verified token -- it is
 * never accepted in the payload.
 */
export async function createDemandRequest({ userId, payload }) {
  await loadVariant(payload.product_variant_id);

  const alreadySupplied = await hasEligibleNearbySupply({
    productVariantId: payload.product_variant_id,
    latitude: payload.latitude,
    longitude: payload.longitude,
    radiusKm: payload.radius_km,
  });
  if (alreadySupplied) {
    throw httpError(409, "A nearby store already has this product. Check the offers above.");
  }

  const client = getServiceClient();
  const { data, error } = await client
    .from("product_demand_requests")
    .insert({ ...payload, user_id: userId })
    .select("id, product_variant_id, status, created_at")
    .single();

  if (!error) {
    return { ...data, already_requested: false };
  }

  // The (user_id, product_variant_id) partial unique index is the intended
  // guard against the same button press creating duplicate demand: a repeat
  // request is a success, not an error, just one that changes nothing.
  if (error.code === "23505") {
    const { data: existing, error: readError } = await client
      .from("product_demand_requests")
      .select("id, product_variant_id, status, created_at")
      .eq("user_id", userId)
      .eq("product_variant_id", payload.product_variant_id)
      .eq("status", "open")
      .maybeSingle();

    if (readError || !existing) throw failed("record your request", readError ?? new Error("row vanished"));
    return { ...existing, already_requested: true };
  }

  throw failed("record your request", error);
}

/**
 * Marks open demand for this exact variant fulfilled wherever the new
 * inventory line is close enough to matter. Best-effort: called right after
 * a store lists a variant, and failing to update old demand rows should never
 * take down the inventory write that triggered it.
 */
export async function fulfillNearbyDemand({ storeLatitude, storeLongitude, productVariantId }) {
  if (storeLatitude == null || storeLongitude == null) return;

  const client = getServiceClient();
  const box = boundingBox(storeLatitude, storeLongitude, STORE_DEMAND_RADIUS_KM);

  const { data, error } = await client
    .from("product_demand_requests")
    .select("id, latitude, longitude")
    .eq("product_variant_id", productVariantId)
    .eq("status", "open")
    .gte("latitude", box.minLat)
    .lte("latitude", box.maxLat)
    .gte("longitude", box.minLng)
    .lte("longitude", box.maxLng);

  if (error) {
    console.error("[kirana-connect-api] load demand to fulfill failed:", error.message);
    return;
  }

  const relevantIds = (data ?? [])
    .filter(
      (row) =>
        haversineKm(storeLatitude, storeLongitude, Number(row.latitude), Number(row.longitude)) <=
        STORE_DEMAND_RADIUS_KM,
    )
    .map((row) => row.id);

  if (relevantIds.length === 0) return;

  const { error: updateError } = await client
    .from("product_demand_requests")
    .update({ status: "fulfilled" })
    .in("id", relevantIds);

  if (updateError) {
    console.error("[kirana-connect-api] fulfill demand failed:", updateError.message);
  }
}

/**
 * Aggregated, identity-free demand near one of the caller's own stores.
 * Ownership of storeId is re-resolved from the database on every call, same
 * as every other seller-facing read in this project.
 */
export async function getStoreDemand({ userId, storeId }) {
  const store = await resolveOwnedStore(userId, storeId);

  if (store.latitude == null || store.longitude == null) {
    return { store, items: [] };
  }

  const client = getServiceClient();
  const box = boundingBox(Number(store.latitude), Number(store.longitude), STORE_DEMAND_RADIUS_KM);

  const { data: rows, error } = await client
    .from("product_demand_requests")
    .select("product_variant_id, latitude, longitude, created_at")
    .eq("status", "open")
    .gte("latitude", box.minLat)
    .lte("latitude", box.maxLat)
    .gte("longitude", box.minLng)
    .lte("longitude", box.maxLng);

  if (error) throw failed("load nearby demand", error);

  const groups = new Map();
  for (const row of rows ?? []) {
    const distance = haversineKm(
      Number(store.latitude),
      Number(store.longitude),
      Number(row.latitude),
      Number(row.longitude),
    );
    if (distance > STORE_DEMAND_RADIUS_KM) continue;

    const group = groups.get(row.product_variant_id);
    if (!group) {
      groups.set(row.product_variant_id, { request_count: 1, latest_requested_at: row.created_at });
    } else {
      group.request_count += 1;
      if (row.created_at > group.latest_requested_at) group.latest_requested_at = row.created_at;
    }
  }

  if (groups.size === 0) return { store, items: [] };

  const variantIds = [...groups.keys()];
  const { data: variants, error: variantsError } = await client
    .from("product_variants")
    .select(VARIANT_DISPLAY_FIELDS)
    .in("id", variantIds);

  if (variantsError) throw failed("load demand product details", variantsError);

  const items = (variants ?? [])
    .map((variant) => {
      const group = groups.get(variant.id);
      const { product, ...variantFields } = variant;
      return {
        product,
        variant: variantFields,
        request_count: group.request_count,
        radius_km: STORE_DEMAND_RADIUS_KM,
        latest_requested_at: group.latest_requested_at,
      };
    })
    .sort((a, b) => b.request_count - a.request_count);

  return { store, items };
}
