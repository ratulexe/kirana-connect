import { apiGet } from "../lib/api.js";

/**
 * Discovery reads for the customer app. Every call goes through the Express
 * API, never straight to Supabase.
 */
export async function fetchCategories({ signal } = {}) {
  const { data } = await apiGet("/categories", { signal });
  return data;
}

export async function fetchProducts({
  search,
  category,
  brand,
  storeId,
  availableOnly = false,
  location,
  radiusKm,
  limit = 24,
  offset = 0,
  signal,
} = {}) {
  const { data, meta } = await apiGet("/products", {
    signal,
    params: {
      q: search,
      category,
      brand,
      store_id: storeId,
      available_only: availableOnly,
      lat: location?.lat,
      lng: location?.lng,
      radius: location ? radiusKm : undefined,
      limit,
      offset,
    },
  });
  return { products: data, meta };
}

export async function fetchProduct({ slug, signal }) {
  const { data } = await apiGet(`/products/${encodeURIComponent(slug)}`, { signal });
  return data;
}

/** Bulk product lookup by id, for the wishlist. */
export async function fetchProductsByIds({ ids, signal }) {
  if (!ids?.length) return [];
  const { data } = await apiGet("/products/by-ids", { signal, params: { ids: ids.join(",") } });
  return data;
}

export async function fetchNearbyStores({ location, radiusKm, limit = 8, offset = 0, signal }) {
  const { data, meta } = await apiGet("/stores/nearby", {
    signal,
    params: {
      lat: location?.lat,
      lng: location?.lng,
      radius: radiusKm,
      limit,
      offset,
    },
  });
  return { stores: data, meta };
}

/** Whole-platform counts for homepage stats -- real data, not placeholder copy. */
export async function fetchPlatformStats({ signal } = {}) {
  const { data } = await apiGet("/stats", { signal });
  return data;
}

/** The single best real markdown against MRP currently listed anywhere public. */
export async function fetchTopDeal({ signal } = {}) {
  const { data } = await apiGet("/deals/top", { signal });
  return data;
}

/** Every listing with a genuine markdown against MRP, biggest discount first. */
export async function fetchBestOffers({ limit = 24, offset = 0, signal } = {}) {
  const { data, meta } = await apiGet("/deals/best", { signal, params: { limit, offset } });
  return { offers: data, meta };
}

/** The price comparison: every nearby store stocking one product. */
export async function fetchProductOffers({ slug, variantId, location, radiusKm, sort, highlightStore, signal }) {
  const { data, meta } = await apiGet(`/products/${encodeURIComponent(slug)}/stores`, {
    signal,
    params: {
      variant_id: variantId,
      lat: location?.lat,
      lng: location?.lng,
      radius: location ? radiusKm : undefined,
      sort: location ? sort : undefined,
      store: highlightStore,
    },
  });
  return { ...data, meta };
}
