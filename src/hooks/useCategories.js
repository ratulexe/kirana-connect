import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../services/catalogue.js";

/**
 * Categories are effectively static, so they are cached for longer than the
 * client default and are not retried aggressively when the API is offline.
 */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories({ signal }),
    staleTime: 1000 * 60 * 10,
  });
}
