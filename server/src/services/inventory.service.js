import { getServiceClient } from "../config/supabase.js";
import { httpError, notFoundError } from "../utils/httpError.js";

/**
 * Store inventory for the authenticated owner.
 *
 * These use the service-role client, which bypasses RLS, so ownership is this
 * module's responsibility on every single call. The rule is simple and applied
 * without exception: the store is resolved from stores.owner_id matching the
 * id on the verified token, and every subsequent query is filtered by that
 * store's id. Nothing is ever trusted from the request body.
 */

const LINE_FIELDS = `
  id, selling_price, stock_status, quantity_available,
  discount_percentage, is_available, last_stock_update, updated_at,
  variant:product_variants!inner (
    id, quantity, unit_code, unit_label, mrp, barcode, image_url, is_active
  ),
  product:products!inner (
    id, name, slug, unit_label, mrp, image_url, is_active,
    category:categories!inner (id, name, slug),
    brand:brands (id, name, slug)
  )
`;

function failed(operation, error) {
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

function withVariantDisplay(item) {
  if (!item) return item;
  const imageUrl = item.variant?.image_url ?? item.product?.image_url ?? null;
  return {
    ...item,
    product_variant_id: item.variant?.id ?? item.product_variant_id,
    product: {
      ...item.product,
      unit_label: item.variant?.unit_label ?? item.product?.unit_label,
      mrp: item.variant?.mrp ?? item.product?.mrp,
      barcode: item.variant?.barcode ?? null,
      image_url: imageUrl,
    },
  };
}

/**
 * The caller's store, or a clear refusal.
 *
 * Inventory is only editable once a store is verified, which matches the
 * product rule that store management stays hidden until approval.
 */
export async function resolveOwnedStore(userId, requestedStoreId) {
  const client = getServiceClient();

  let query = client
    .from("stores")
    .select("id, name, slug, is_verified, is_active")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  if (requestedStoreId) query = query.eq("id", requestedStoreId);

  const { data, error } = await query;
  if (error) throw failed("load your store", error);

  const store = data?.[0];
  if (!store) {
    // Same response whether the store does not exist or belongs to someone
    // else, so this cannot be used to probe for other owners' store ids.
    throw notFoundError("No store of yours was found. Register a store first.");
  }

  if (!store.is_verified) {
    throw httpError(
      403,
      "Your store is still awaiting verification. You can add products once it is approved.",
    );
  }

  return store;
}

export async function listInventory({ userId, storeId }) {
  const store = await resolveOwnedStore(userId, storeId);
  const client = getServiceClient();

  const { data, error } = await client
    .from("store_products")
    .select(LINE_FIELDS)
    .eq("store_id", store.id)
    .order("updated_at", { ascending: false });

  if (error) throw failed("load your inventory", error);

  return { store, items: (data ?? []).map(withVariantDisplay) };
}

export async function addInventoryItem({ userId, storeId, payload }) {
  const store = await resolveOwnedStore(userId, storeId);
  const client = getServiceClient();

  const { data: variant, error: variantError } = await client
    .from("product_variants")
    .select("id, product_id, unit_label, is_active, product:products!inner (id, name, is_active)")
    .eq("id", payload.product_variant_id)
    .maybeSingle();

  if (variantError) throw failed("check that product size", variantError);
  if (!variant) throw notFoundError("That product size is not in the catalogue.");
  if (!variant.is_active || !variant.product?.is_active) {
    throw httpError(409, "That product size is no longer available in the catalogue.");
  }

  const { data, error } = await client
    .from("store_products")
    .insert({ ...payload, product_id: variant.product_id, store_id: store.id })
    .select(LINE_FIELDS)
    .single();

  if (error) {
    // The (store_id, product_variant_id) unique constraint is the intended
    // guard against listing the same product size twice.
    if (error.code === "23505") {
      throw httpError(409, `${variant.product.name} ${variant.unit_label} is already in your inventory.`);
    }
    throw failed("add that product", error);
  }

  return withVariantDisplay(data);
}

export async function updateInventoryItem({ userId, itemId, storeId, buildPatch }) {
  const store = await resolveOwnedStore(userId, storeId);
  const client = getServiceClient();

  // Read the current row scoped to the owner's store, so a line belonging to
  // another store simply is not found.
  const { data: current, error: readError } = await client
    .from("store_products")
    .select("id, stock_status, is_available")
    .eq("id", itemId)
    .eq("store_id", store.id)
    .maybeSingle();

  if (readError) throw failed("load that product", readError);
  if (!current) throw notFoundError("That product is not in your inventory.");

  const patch = buildPatch(current);

  const { data, error } = await client
    .from("store_products")
    .update(patch)
    .eq("id", itemId)
    .eq("store_id", store.id)
    .select(LINE_FIELDS)
    .single();

  if (error) throw failed("update that product", error);

  return withVariantDisplay(data);
}

export async function removeInventoryItem({ userId, itemId, storeId }) {
  const store = await resolveOwnedStore(userId, storeId);
  const client = getServiceClient();

  const { data, error } = await client
    .from("store_products")
    .delete()
    .eq("id", itemId)
    .eq("store_id", store.id)
    .select("id")
    .maybeSingle();

  if (error) throw failed("remove that product", error);
  if (!data) throw notFoundError("That product is not in your inventory.");

  return { id: data.id };
}
