import { getPublicClient } from "../config/supabase.js";
import { notFoundError, httpError } from "../utils/httpError.js";
import { escapeLikePattern } from "../utils/queryParams.js";
import { removePlaceholderPieceVariants } from "../utils/productUnits.js";

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

export async function listCategories() {
  const { data, error } = await getPublicClient()
    .from("categories")
    .select("id, name, slug, description, image_url")
    .order("name", { ascending: true });

  if (error) throw failed("category lookup", error);
  return data;
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
      };
    }
    throw failed("product search", error);
  }

  const products = (data ?? []).map(({ store_products: _storeProducts, ...product }) => withVariantSummary(product));

  return { products, total: count ?? 0 };
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
