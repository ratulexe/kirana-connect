import { getPublicClient, getServiceClient } from "../config/supabase.js";
import { httpError, notFoundError } from "../utils/httpError.js";
import { generateUniqueSlug } from "../utils/slug.js";
import { resolveOwnedStore } from "./inventory.service.js";

/**
 * The business-category taxonomy and store-classification foundation for
 * future competitor mapping. Deliberately separate from public.categories
 * (products) -- see the migration header for why the two are not the same
 * concept.
 */

const CATEGORY_FIELDS = "id, name, slug, description, is_active, created_at, updated_at";

function failed(operation, error) {
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

async function slugFor(name, currentId) {
  const isTaken = async (candidate) => {
    let query = getServiceClient().from("business_categories").select("id").eq("slug", candidate).limit(1);
    if (currentId) query = query.neq("id", currentId);
    const { data, error } = await query;
    if (error) throw failed("check business category slug", error);
    return Boolean(data?.length);
  };
  return generateUniqueSlug(name, isTaken);
}

/** Public taxonomy read: active categories only, via the anon-key client. */
export async function listActiveBusinessCategories() {
  const { data, error } = await getPublicClient()
    .from("business_categories")
    .select("id, name, slug, description")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw failed("load business categories", error);
  return data ?? [];
}

/**
 * One active business category by slug, or null. The shared lookup behind
 * both competitor discovery and demand-supply analysis -- each of those
 * services needs the category's id (to filter on) and name (to display),
 * nothing more.
 */
export async function getActiveBusinessCategoryBySlug(slug) {
  const { data, error } = await getPublicClient()
    .from("business_categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw failed("load that business category", error);
  return data;
}

/** Admin taxonomy read: every category, including inactive ones. */
export async function listAllBusinessCategories() {
  const { data, error } = await getServiceClient()
    .from("business_categories")
    .select(CATEGORY_FIELDS)
    .order("name", { ascending: true });

  if (error) throw failed("load business categories", error);
  return data ?? [];
}

export async function createBusinessCategory({ name, description }) {
  const { data, error } = await getServiceClient()
    .from("business_categories")
    .insert({ name, description, slug: await slugFor(name) })
    .select(CATEGORY_FIELDS)
    .single();

  if (error?.code === "23505") throw httpError(409, "A business category with that name already exists.");
  if (error) throw failed("create that business category", error);
  return data;
}

export async function updateBusinessCategory(id, patch) {
  const body = { ...patch };
  if (body.name) body.slug = await slugFor(body.name, id);

  const { data, error } = await getServiceClient()
    .from("business_categories")
    .update(body)
    .eq("id", id)
    .select(CATEGORY_FIELDS)
    .maybeSingle();

  if (error?.code === "23505") throw httpError(409, "A business category with that name already exists.");
  if (error) throw failed("update that business category", error);
  if (!data) throw notFoundError("Business category not found.");
  return data;
}

const ASSIGNMENT_FIELDS = `
  is_primary,
  business_category:business_categories (id, name, slug, description)
`;

/**
 * One store's current classification, shaped for direct API/UI consumption.
 * An unclassified store returns { primary_business_category: null,
 * business_categories: [] } -- never a fabricated default.
 */
export async function fetchStoreBusinessCategories(client, storeId) {
  const { data, error } = await client
    .from("store_business_categories")
    .select(ASSIGNMENT_FIELDS)
    .eq("store_id", storeId);

  if (error) throw failed("load business categories for that store", error);

  const rows = data ?? [];
  const primary = rows.find((row) => row.is_primary) ?? null;
  return {
    primary_business_category: primary?.business_category ?? null,
    business_categories: rows.map((row) => row.business_category).filter(Boolean),
  };
}

/** Batch form of fetchStoreBusinessCategories, for list views. */
export async function fetchBusinessCategoriesForStores(client, storeIds) {
  if (storeIds.length === 0) return new Map();

  const { data, error } = await client
    .from("store_business_categories")
    .select(`store_id, ${ASSIGNMENT_FIELDS}`)
    .in("store_id", storeIds);

  if (error) throw failed("load business categories for those stores", error);

  const byStore = new Map(storeIds.map((id) => [id, []]));
  for (const row of data ?? []) {
    byStore.get(row.store_id)?.push(row);
  }

  return new Map(
    [...byStore.entries()].map(([storeId, rows]) => {
      const primary = rows.find((row) => row.is_primary) ?? null;
      return [
        storeId,
        {
          primary_business_category: primary?.business_category ?? null,
          business_categories: rows.map((row) => row.business_category).filter(Boolean),
        },
      ];
    }),
  );
}

/**
 * Full-replace for one store's category set: the caller sends the complete
 * resulting list of category ids plus which one is primary, and this
 * deletes the store's existing rows and inserts the new set. A diff would
 * be more surgical, but a store only ever carries a handful of categories,
 * and delete-then-insert is far easier to reason about correctly -- the
 * partial unique index on (store_id) where is_primary is the actual,
 * database-level guarantee against two primaries, not this function.
 *
 * category_ids empty + primary_category_id null is the valid "Unclassified"
 * state, not an error.
 */
export async function replaceStoreBusinessCategories({ storeId, categoryIds, primaryCategoryId }) {
  const client = getServiceClient();

  if (categoryIds.length > 0) {
    const { data: validCategories, error: validationError } = await client
      .from("business_categories")
      .select("id")
      .eq("is_active", true)
      .in("id", categoryIds);

    if (validationError) throw failed("validate business categories", validationError);
    if ((validCategories ?? []).length !== categoryIds.length) {
      throw httpError(400, "One or more selected business categories are not valid.");
    }
  }

  const { error: deleteError } = await client
    .from("store_business_categories")
    .delete()
    .eq("store_id", storeId);
  if (deleteError) throw failed("update business categories", deleteError);

  if (categoryIds.length > 0) {
    const { error: insertError } = await client.from("store_business_categories").insert(
      categoryIds.map((categoryId) => ({
        store_id: storeId,
        business_category_id: categoryId,
        is_primary: categoryId === primaryCategoryId,
      })),
    );
    if (insertError) throw failed("update business categories", insertError);
  }

  return fetchStoreBusinessCategories(client, storeId);
}

/**
 * Store-owner path: re-verifies ownership (and that the store is verified)
 * exactly like every inventory write, via the same resolveOwnedStore this
 * app already uses for that gate -- classification follows the same
 * "editable once approved" rule as the rest of the store profile.
 */
export async function setOwnStoreBusinessCategories({ userId, storeId, categoryIds, primaryCategoryId }) {
  const store = await resolveOwnedStore(userId, storeId);
  return replaceStoreBusinessCategories({ storeId: store.id, categoryIds, primaryCategoryId });
}

/** Admin override path: no ownership or verification gate, admin can classify any store. */
export async function adminSetStoreBusinessCategories({ storeId, categoryIds, primaryCategoryId }) {
  const { data: store, error } = await getServiceClient()
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .maybeSingle();

  if (error) throw failed("load that store", error);
  if (!store) throw notFoundError("Store not found.");

  return replaceStoreBusinessCategories({ storeId, categoryIds, primaryCategoryId });
}

// -----------------------------------------------------------------------
// Business category -> product category mapping (Demand-Supply Gap module)
// -----------------------------------------------------------------------
// A business category with zero mapped product categories is a real,
// distinct state ("mapping not configured yet"), never silently treated as
// "matches everything" or "matches nothing scored the same as an error".
// Callers (demandSupply.service.js) branch on an empty array explicitly.

/** Just the product category ids mapped to a business category -- the hot path for demand/supply filtering. */
export async function getMappedProductCategoryIds(businessCategoryId) {
  const { data, error } = await getServiceClient()
    .from("business_category_product_categories")
    .select("product_category_id")
    .eq("business_category_id", businessCategoryId);

  if (error) throw failed("load mapped product categories", error);
  return (data ?? []).map((row) => row.product_category_id);
}

/** Admin read: the full mapped category objects, for review/editing. */
export async function listProductCategoryMappings(businessCategoryId) {
  const { data, error } = await getServiceClient()
    .from("business_category_product_categories")
    .select("product_category:categories (id, name, slug)")
    .eq("business_category_id", businessCategoryId);

  if (error) throw failed("load mapped product categories", error);
  return (data ?? []).map((row) => row.product_category).filter(Boolean);
}

/**
 * Full-replace for one business category's product-category mapping,
 * mirroring replaceStoreBusinessCategories's delete-then-insert approach:
 * a business category maps to at most a handful of product categories, so
 * this stays easy to reason about, and the composite primary key on the
 * table is what actually guarantees no duplicate pair, not this function.
 */
export async function replaceProductCategoryMappings(businessCategoryId, productCategoryIds) {
  const uniqueIds = [...new Set(productCategoryIds)];
  const client = getServiceClient();

  if (uniqueIds.length > 0) {
    const { data: validCategories, error: validationError } = await client
      .from("categories")
      .select("id")
      .eq("is_active", true)
      .in("id", uniqueIds);

    if (validationError) throw failed("validate product categories", validationError);
    if ((validCategories ?? []).length !== uniqueIds.length) {
      throw httpError(400, "One or more selected product categories are not valid.");
    }
  }

  const { error: deleteError } = await client
    .from("business_category_product_categories")
    .delete()
    .eq("business_category_id", businessCategoryId);
  if (deleteError) throw failed("update product category mapping", deleteError);

  if (uniqueIds.length > 0) {
    const { error: insertError } = await client.from("business_category_product_categories").insert(
      uniqueIds.map((productCategoryId) => ({
        business_category_id: businessCategoryId,
        product_category_id: productCategoryId,
      })),
    );
    if (insertError) throw failed("update product category mapping", insertError);
  }

  return listProductCategoryMappings(businessCategoryId);
}
