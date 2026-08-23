import { getPublicClient } from "../config/supabase.js";
import { notFoundError, httpError } from "../utils/httpError.js";
import { escapeLikePattern } from "../utils/queryParams.js";

// Every query here runs through the anon-key client, so row level security
// still applies: inactive products and unverified stores are filtered by the
// database, not merely by the conditions written below.

const PRODUCT_FIELDS = `
  id, name, slug, description, image_url, unit_label, mrp, barcode,
  category:categories!inner (id, name, slug),
  brand:brands (id, name, slug, logo_url)
`;

const PRODUCT_WITH_AVAILABLE_INVENTORY_FIELDS = `
  ${PRODUCT_FIELDS},
  store_products!inner (id, store_id)
`;

function failed(operation, error) {
  return httpError(502, `Supabase ${operation} failed: ${error.message}`);
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
  const fields =
    filters.availableOnly || filters.storeId ? PRODUCT_WITH_AVAILABLE_INVENTORY_FIELDS : PRODUCT_FIELDS;
  const query = applyProductFilters(
    getPublicClient().from("products").select(fields, { count: "exact", head: true }),
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
  const fields = availableOnly || storeId ? PRODUCT_WITH_AVAILABLE_INVENTORY_FIELDS : PRODUCT_FIELDS;
  const query = applyProductFilters(
    getPublicClient().from("products").select(fields, { count: "exact" }),
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

  const products = (data ?? []).map(({ store_products: _storeProducts, ...product }) => product);

  return { products, total: count ?? 0 };
}

export async function getProductBySlug(slug) {
  const { data, error } = await getPublicClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw failed("product lookup", error);
  if (!data) throw notFoundError(`No product found with slug "${slug}"`);

  return data;
}
