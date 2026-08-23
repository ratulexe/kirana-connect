import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";

export const onboardingKeys = { status: ["store-onboarding", "status"] };

/**
 * The authenticated owner's application status. The backend scopes this to the
 * verified user, so it can never return another owner's store.
 */
export function useOnboardingStatus({ enabled = true } = {}) {
  return useQuery({
    queryKey: onboardingKeys.status,
    queryFn: ({ signal }) => api.getOnboardingStatus({ signal }),
    enabled,
  });
}

export function useSubmitStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => api.submitStore(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.status }),
  });
}

export function useSubmitStoreChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, payload }) => api.submitStoreChange(storeId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.status }),
  });
}
