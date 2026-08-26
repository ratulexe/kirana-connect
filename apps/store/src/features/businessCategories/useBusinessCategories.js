import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";
import { onboardingKeys } from "../onboarding/useOnboarding.js";

export function useBusinessCategories() {
  return useQuery({
    queryKey: ["business-categories"],
    queryFn: ({ signal }) => api.getBusinessCategories({ signal }),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateStoreBusinessCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, categoryIds, primaryCategoryId }) =>
      api.updateStoreBusinessCategories(storeId, {
        category_ids: categoryIds,
        primary_category_id: primaryCategoryId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: onboardingKeys.status }),
  });
}
