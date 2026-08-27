import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";

export const reservationKeys = {
  list: (storeId) => ["store-reservations", storeId ?? "default"],
};

export function useStoreReservations(storeId) {
  return useQuery({
    queryKey: reservationKeys.list(storeId),
    queryFn: ({ signal }) => api.getStoreReservations({ storeId, signal }),
    retry: (count, error) => error?.status !== 403 && error?.status !== 404 && count < 1,
  });
}

/** Not a query -- looked up on demand from a search box, one code at a time. */
export function useReservationLookup(storeId) {
  return useMutation({
    mutationFn: (code) => api.lookupStoreReservation({ storeId, code }),
  });
}

export function useCollectReservation(storeId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId) => api.collectStoreReservation({ reservationId, storeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.list(storeId) });
      // Collection changes physical stock, which the inventory list displays.
      queryClient.invalidateQueries({ queryKey: ["store-inventory", storeId ?? "default"] });
    },
  });
}
