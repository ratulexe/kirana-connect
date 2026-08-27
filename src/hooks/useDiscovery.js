import { useQuery } from "@tanstack/react-query";
import {
  fetchNearbyStores,
  fetchProducts,
  fetchProduct,
  fetchProductsByIds,
  fetchProductOffers,
  fetchPlatformStats,
  fetchTopDeal,
  fetchHomepageMoments,
  fetchBestOffers,
} from "../services/catalogue.js";

export const discoveryKeys = {
  products: (params) => ["products", params],
  product: (slug) => ["product", slug],
  productsByIds: (ids) => ["products-by-ids", ids],
  offers: (slug, variantId, params) => ["product-offers", slug, variantId, params],
  nearbyStores: (params) => ["nearby-stores", params],
  stats: ["platform-stats"],
  topDeal: ["top-deal"],
  homepageMoments: ["homepage-moments"],
  bestOffers: (params) => ["best-offers", params],
};

export function usePlatformStats() {
  return useQuery({
    queryKey: discoveryKeys.stats,
    queryFn: ({ signal }) => fetchPlatformStats({ signal }),
    staleTime: 5 * 60_000,
  });
}

export function useTopDeal() {
  return useQuery({
    queryKey: discoveryKeys.topDeal,
    queryFn: ({ signal }) => fetchTopDeal({ signal }),
    staleTime: 5 * 60_000,
  });
}

export function useHomepageMoments() {
  return useQuery({
    queryKey: discoveryKeys.homepageMoments,
    queryFn: ({ signal }) => fetchHomepageMoments({ signal }),
    staleTime: 5 * 60_000,
  });
}

export function useBestOffers({ limit = 24, offset = 0 } = {}) {
  const params = { limit, offset };

  return useQuery({
    queryKey: discoveryKeys.bestOffers(params),
    queryFn: ({ signal }) => fetchBestOffers({ limit, offset, signal }),
    placeholderData: (previous) => previous,
    staleTime: 60_000,
  });
}

export function useProductSearch({ search, category, brand, storeId, availableOnly = false, location, radiusKm, limit, offset, refetchInterval }) {
  const params = {
    search: search || null,
    category: category || null,
    brand: brand || null,
    storeId: storeId || null,
    availableOnly,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    radiusKm: location ? radiusKm : null,
    limit,
    offset,
  };

  return useQuery({
    queryKey: discoveryKeys.products(params),
    queryFn: ({ signal }) =>
      fetchProducts({ search, category, brand, storeId, availableOnly, location, radiusKm, limit, offset, signal }),
    // Keeps the previous page visible while the next one loads, so the list
    // does not collapse to a skeleton on every keystroke.
    placeholderData: (previous) => previous,
    refetchInterval,
    refetchIntervalInBackground: false,
  });
}

export function useBrandProducts({ brandSlug, excludeSlug, limit = 8 }) {
  return useQuery({
    queryKey: ["brand-products", brandSlug, excludeSlug, limit],
    queryFn: async ({ signal }) => {
      const { products } = await fetchProducts({ brand: brandSlug, limit, signal });
      return products.filter((p) => p.slug !== excludeSlug);
    },
    enabled: Boolean(brandSlug),
    staleTime: 5 * 60_000,
  });
}

export function useNearbyStores({ location, radiusKm, limit = 8, offset = 0 }) {
  const params = { lat: location?.lat, lng: location?.lng, radiusKm, limit, offset };

  return useQuery({
    queryKey: discoveryKeys.nearbyStores(params),
    queryFn: ({ signal }) => fetchNearbyStores({ location, radiusKm, limit, offset, signal }),
    enabled: Boolean(location),
    placeholderData: (previous) => previous,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: discoveryKeys.product(slug),
    queryFn: ({ signal }) => fetchProduct({ slug, signal }),
    enabled: Boolean(slug),
  });
}

export function useProductsByIds(ids) {
  return useQuery({
    queryKey: discoveryKeys.productsByIds(ids),
    queryFn: ({ signal }) => fetchProductsByIds({ ids, signal }),
    enabled: ids.length > 0,
  });
}

/**
 * variantId is optional: when the caller has not pinned an exact size (no
 * `?variant=` in the URL, no size button clicked yet), the backend itself
 * picks whichever size actually has a nearby store, rather than this hook
 * forcing a default here -- see findStoresStockingProduct's pickVariant.
 */
export function useProductOffers({ slug, variantId, location, radiusKm, sort, highlightStore }) {
  const params = { lat: location?.lat, lng: location?.lng, radiusKm, sort, highlightStore };

  return useQuery({
    queryKey: discoveryKeys.offers(slug, variantId, params),
    queryFn: ({ signal }) => fetchProductOffers({ slug, variantId, location, radiusKm, sort, highlightStore, signal }),
    enabled: Boolean(slug),
  });
}
