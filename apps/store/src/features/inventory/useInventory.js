import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";

export const inventoryKeys = {
  list: ["store-inventory"],
  catalogue: (term) => ["catalogue", term],
};

export function useInventory() {
  return useQuery({
    queryKey: inventoryKeys.list,
    queryFn: ({ signal }) => api.getInventory({ signal }),
    // A 403 means the store is not verified yet; retrying will not change that.
    retry: (count, error) => error?.status !== 403 && error?.status !== 404 && count < 1,
  });
}

/**
 * Catalogue lookup for the add-product panel. Disabled until the term is long
 * enough to be worth a round trip.
 */
export function useCatalogueSearch(term) {
  const query = term.trim();

  return useQuery({
    queryKey: inventoryKeys.catalogue(query),
    queryFn: ({ signal }) => api.searchCatalogue({ q: query, signal }),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

function useInventoryMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoryKeys.list }),
  });
}

export const useAddInventoryItem = () => useInventoryMutation((body) => api.addInventoryItem(body));

export const useUpdateInventoryItem = () =>
  useInventoryMutation(({ itemId, patch }) => api.updateInventoryItem(itemId, patch));

export const useRemoveInventoryItem = () =>
  useInventoryMutation((itemId) => api.removeInventoryItem(itemId));
