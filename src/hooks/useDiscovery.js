import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchProduct, fetchProductOffers } from "../services/catalogue.js";

export const discoveryKeys = {
  products: (params) => ["products", params],
  product: (slug) => ["product", slug],
  offers: (slug, params) => ["product-offers", slug, params],
};

export function useProductSearch({ search, category, availableOnly = false, limit, offset }) {
  const params = { search: search || null, category: category || null, availableOnly, limit, offset };

  return useQuery({
    queryKey: discoveryKeys.products(params),
    queryFn: ({ signal }) =>
      fetchProducts({ search, category, availableOnly, limit, offset, signal }),
    // Keeps the previous page visible while the next one loads, so the list
    // does not collapse to a skeleton on every keystroke.
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

export function useProductOffers({ slug, location, radiusKm, sort }) {
  const params = { lat: location?.lat, lng: location?.lng, radiusKm, sort };

  return useQuery({
    queryKey: discoveryKeys.offers(slug, params),
    queryFn: ({ signal }) => fetchProductOffers({ slug, location, radiusKm, sort, signal }),
    enabled: Boolean(slug),
  });
}
