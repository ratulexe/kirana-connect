import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api.js";

export const demandKeys = {
  list: (storeId) => ["store-demand", storeId ?? "default"],
};

export function useStoreDemand(storeId) {
  return useQuery({
    queryKey: demandKeys.list(storeId),
    queryFn: ({ signal }) => api.getStoreDemand({ storeId, signal }),
    enabled: Boolean(storeId),
    retry: (count, error) => error?.status !== 403 && error?.status !== 404 && count < 1,
  });
}
