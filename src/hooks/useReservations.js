import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReservation, fetchMyReservations, cancelReservation } from "../services/reservations.js";

export const reservationKeys = {
  mine: ["reservations", "mine"],
};

export function useMyReservations({ enabled = true } = {}) {
  return useQuery({
    queryKey: reservationKeys.mine,
    queryFn: ({ signal }) => fetchMyReservations({ signal }),
    enabled,
    staleTime: 15_000,
  });
}

/**
 * A successful reserve/cancel changes availability that several other cached
 * reads depend on -- the per-store offers list on the product page, and this
 * customer's own reservation list -- so both are invalidated together
 * rather than trusting a page refresh. "product-offers" is
 * discoveryKeys.offers's own leading key segment (see useDiscovery.js);
 * invalidating that root catches every slug/variant/params combination
 * already cached, not just the one just reserved.
 */
function invalidateReservationDependents(queryClient) {
  queryClient.invalidateQueries({ queryKey: reservationKeys.mine });
  queryClient.invalidateQueries({ queryKey: ["product-offers"] });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => invalidateReservationDependents(queryClient),
    // A conflict (409) means the cached availability was already stale --
    // refetching immediately is what flips the button to "Out of stock"
    // without the customer needing to reload.
    onError: () => invalidateReservationDependents(queryClient),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => invalidateReservationDependents(queryClient),
  });
}
