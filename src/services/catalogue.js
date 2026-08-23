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
  storeId,
  availableOnly = false,
  limit = 24,
  offset = 0,
  signal,
} = {}) {
  const { data, meta } = await apiGet("/products", {
    signal,
    params: { q: search, category, store_id: storeId, available_only: availableOnly, limit, offset },
  });
  return { products: data, meta };
}

export async function fetchProduct({ slug, signal }) {
  const { data } = await apiGet(`/products/${encodeURIComponent(slug)}`, { signal });
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

/** The price comparison: every nearby store stocking one product. */
export async function fetchProductOffers({ slug, location, radiusKm, sort, signal }) {
  const { data, meta } = await apiGet(`/products/${encodeURIComponent(slug)}/stores`, {
    signal,
    params: {
      lat: location?.lat,
      lng: location?.lng,
      radius: location ? radiusKm : undefined,
      sort: location ? sort : undefined,
    },
  });
  return { ...data, meta };
}
