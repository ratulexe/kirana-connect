import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: (count, error) => error?.status !== 401 && error?.status !== 403 && count < 1,
    },
  },
});
