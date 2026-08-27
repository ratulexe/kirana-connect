import { getPublicClient } from "../config/supabase.js";
import { notFoundError, httpError } from "../utils/httpError.js";
import { escapeLikePattern } from "../utils/queryParams.js";
import { removePlaceholderPieceVariants } from "../utils/productUnits.js";
import { boundingBox, haversineKm } from "../utils/geo.js";

// Every query here runs through the anon-key client, so row level security
// still applies: inactive products and unverified stores are filtered by the
// database, not merely by the conditions written below.

const PRODUCT_BASE_FIELDS = `
  id, name, slug, description, image_url, unit_label, mrp, barcode,
  category:categories!inner (id, name, slug),
  variants:product_variants (
    id, product_id, quantity, unit_code, unit_label, mrp, barcode, image_url, is_active
  )
`;

const productFields = ({ brandSlug, availableOnly, storeId } = {}) => `
  ${PRODUCT_BASE_FIELDS},
  brand:brands${brandSlug ? "!inner" : ""} (id, name, slug, logo_url)
  ${availableOnly || storeId ? ", store_products!inner (id, store_id)" : ""}
`;

function failed(operation, error) {
  return httpError(502, `Supabase ${operation} failed: ${error.message}`);
}

function variantSort(a, b) {
  if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
  return Number(a.quantity) - Number(b.quantity);
}

function withVariantSummary(product) {
  const variants = removePlaceholderPieceVariants(product.variants).sort(variantSort);
  const activeVariants = variants.filter((item) => item.is_active);
  const variant = variants.find((item) => item.is_active) ?? variants[0] ?? null;
  return {
    ...product,
    variants,
    unit_label: variant?.unit_label ?? product.unit_label,
    mrp: variant?.mrp ?? product.mrp,
    barcode: variant?.barcode ?? product.barcode,
    image_url: variant?.image_url ?? product.image_url,
    variant_count: variants.length,
    price_from: activeVariants.length
      ? Math.min(...activeVariants.map((item) => Number(item.mrp)))
      : Number(product.mrp),
  };
}

/**
 * One representative product image per category, for the home page's
 * image-first category tiles. `categories.image_url` is never populated
 * today (confirmed against the seed data), so this is the honest fallback
 * the design calls for: a real photo of something actually in that
 * category, never a fabricated or hot-linked asset. Two small columns
 * (`category_id`, `image_url`) across the whole catalogue is a cheap
 * query at this data size -- the first non-null image per category is
 * kept, everything else is discarded client-side.
 */
async function sampleImagesByCategory(client, categoryIds) {
  if (categoryIds.length === 0) return new Map();

  const { data, error } = await client
    .from("products")
    .select("category_id, image_url")
    .in("category_id", categoryIds)
    .not("image_url", "is", null)
    .order("category_id", { ascending: true });

  if (error) throw failed("category sample image lookup", error);

  const byCategory = new Map();
  for (const row of data ?? []) {
    if (!byCategory.has(row.category_id)) byCategory.set(row.category_id, row.image_url);
  }
  return byCategory;
}

export async function listCategories() {
  const client = getPublicClient();
  const { data, error } = await client
    .from("categories")
    .select("id, name, slug, description, image_url")
    .order("name", { ascending: true });

  if (error) throw failed("category lookup", error);

  const sampleImages = await sampleImagesByCategory(client, data.map((category) => category.id));

  // Additive only: every existing consumer of `image_url` keeps working
  // unchanged. `sample_image_url` is the new field the category tiles read.
  return data.map((category) => ({
    ...category,
    sample_image_url: category.image_url ?? sampleImages.get(category.id) ?? null,
  }));
}

export async function listBrands() {
  const { data, error } = await getPublicClient()
    .from("brands")
    .select("id, name, slug, logo_url")
    .order("name", { ascending: true });

  if (error) throw failed("brand lookup", error);
  return data;
}

function applyProductFilters(query, { search, categorySlug, brandSlug, storeId }) {
  if (search) {
    query = query.ilike("name", `%${escapeLikePattern(search)}%`);
  }
  if (categorySlug) {
    query = query.eq("category.slug", categorySlug);
  }
  if (brandSlug) {
    query = query.eq("brand.slug", brandSlug);
  }
  if (storeId) {
    query = query.eq("store_products.store_id", storeId);
  }
  return query;
}

async function countProducts(filters) {
  const query = applyProductFilters(
    getPublicClient().from("products").select(productFields(filters), { count: "exact", head: true }),
    filters,
  );

  const { error, count } = await query;
  if (error) throw failed("product count", error);
  return count ?? 0;
}

/** Products by id, in whatever order the caller's id list specifies -- used for wishlist lookups. */
export async function listProductsByIds(ids) {
  if (!ids.length) return [];

  const { data, error } = await getPublicClient()
    .from("products")
    .select(productFields())
    .in("id", ids);

  if (error) throw failed("product lookup by id", error);

  const bySlotOrder = new Map((data ?? []).map((product) => [product.id, withVariantSummary(product)]));
  return ids.map((id) => bySlotOrder.get(id)).filter(Boolean);
}

/**
 * Whether each product has a store within the customer's radius that lists
 * it, plus how many distinct stores that covers in total. One query scoped
 * to just this page's product ids, not a join on the main listing query, so
 * pagination and the count total stay unaffected by location -- the distinct
 * store count is read off this same query rather than a second one, since
 * search-event instrumentation needs it too and must not add its own query.
 *
 * nearbyStoreCount is null when there is no location -- the figure is then
 * genuinely unknown -- but 0 when there is a location and simply no matching
 * products to check: zero products can never be stocked by any store, so
 * that is a real, calculable zero, not an unknown.
 */
async function attachNearbyAvailability(products, location) {
  if (!location) return { products, nearbyStoreCount: null };
  if (products.length === 0) return { products, nearbyStoreCount: 0 };

  // Matched by variant, not by the coarser product_id: each product's own
  // .variants array here has already been through withVariantSummary /
  // removePlaceholderPieceVariants, so it is exactly the set of sizes a
  // customer can actually see and select. Matching on product_id instead
  // would also count a store whose store_products row still points at a
  // variant that got filtered out of that display list (e.g. a leftover "1
  // pc" placeholder from before real sizes were added to the product) --
  // that store is nearby, but nothing about it is actually selectable, so
  // findStoresStockingProduct (which does filter by the resolved variant)
  // would then correctly find nothing, contradicting this badge.
  const variantToProduct = new Map();
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      variantToProduct.set(variant.id, product.id);
    }
  }
  const variantIds = [...variantToProduct.keys()];
  if (variantIds.length === 0) return { products, nearbyStoreCount: 0 };

  const box = boundingBox(location.lat, location.lng, location.radiusKm);
  const { data, error } = await getPublicClient()
    .from("store_products")
    .select("product_variant_id, store:stores!inner(id, latitude, longitude)")
    .in("product_variant_id", variantIds)
    // Must match the same filter the actual per-product offers query uses
    // (findStoresStockingProduct in discovery.service.js), or this "available
    // nearby" badge can be true for a listing whose real store search then
    // comes back empty -- a delisted/unavailable row is still a nearby row,
    // just not a buyable one.
    .eq("is_available", true)
    .gte("store.latitude", box.minLat)
    .lte("store.latitude", box.maxLat)
    .gte("store.longitude", box.minLng)
    .lte("store.longitude", box.maxLng);

  if (error) throw failed("nearby availability lookup", error);

  const nearbyProductIds = new Set();
  const nearbyStoreIds = new Set();
  for (const row of data ?? []) {
    if (!row.store) continue;
    const distance = haversineKm(location.lat, location.lng, Number(row.store.latitude), Number(row.store.longitude));
    if (distance <= location.radiusKm) {
      const productId = variantToProduct.get(row.product_variant_id);
      if (productId) nearbyProductIds.add(productId);
      nearbyStoreIds.add(row.store.id);
    }
  }

  return {
    products: products.map((product) => ({ ...product, available_nearby: nearbyProductIds.has(product.id) })),
    nearbyStoreCount: nearbyStoreIds.size,
  };
}

/**
 * Catalogue browse and search.
 *
 * Search matches product name only. That is the column carrying the trigram
 * index, so `ilike '%term%'` stays index-assisted; description has no such
 * index and would force a sequential scan.
 */
export async function listProducts({
  search,
  categorySlug,
  brandSlug,
  storeId,
  limit,
  offset,
  availableOnly = false,
  location = null,
}) {
  const query = applyProductFilters(
    getPublicClient().from("products").select(productFields({ brandSlug, availableOnly, storeId }), { count: "exact" }),
    { search, categorySlug, brandSlug, storeId, availableOnly },
  );

  const { data, error, count } = await query
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    // PostgREST rejects a range that starts past the last row. That is a valid
    // request for a page beyond the end, not a failure, so report an empty page
    // with the real total rather than a 502.
    if (error.code === "PGRST103") {
      return {
        products: [],
        total: await countProducts({ search, categorySlug, brandSlug, storeId, availableOnly }),
        nearbyStoreCount: null,
      };
    }
    throw failed("product search", error);
  }

  const products = (data ?? []).map(({ store_products: _storeProducts, ...product }) => withVariantSummary(product));
  const annotated = await attachNearbyAvailability(products, location);

  return { products: annotated.products, total: count ?? 0, nearbyStoreCount: annotated.nearbyStoreCount };
}

export async function getProductBySlug(slug) {
  const { data, error } = await getPublicClient()
    .from("products")
    .select(productFields())
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw failed("product lookup", error);
  if (!data) throw notFoundError(`No product found with slug "${slug}"`);

  const { data: media, error: mediaError } = await getPublicClient()
    .from("product_media")
    .select("id, media_type, image_url, alt_text, sort_order, is_primary")
    .eq("product_id", data.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (mediaError) {
    console.error("[kirana-connect-api] product media lookup failed:", mediaError.message);
    return { ...data, media: [] };
  }

  return { ...withVariantSummary(data), media: media ?? [] };
}
