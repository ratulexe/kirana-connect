import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";

export const adminKeys = {
  me: ["admin", "me"],
  dashboard: ["admin", "dashboard"],
  pendingStores: ["admin", "stores", "pending"],
  stores: (params = {}) => ["admin", "stores", params],
  store: (id) => ["admin", "stores", id],
  sellers: ["admin", "sellers"],
  products: (params = {}) => ["admin", "products", params],
  product: (id) => ["admin", "products", id],
  categories: ["admin", "categories"],
  brands: ["admin", "brands"],
};

export function useAdminMe(options) {
  return useQuery({
    queryKey: adminKeys.me,
    queryFn: ({ signal }) => api.me({ signal }).then((r) => r.data),
    ...options,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: ({ signal }) => api.dashboard({ signal }).then((r) => r.data),
  });
}

export function usePendingStores() {
  return useQuery({
    queryKey: adminKeys.pendingStores,
    queryFn: ({ signal }) => api.pendingStores({ signal }).then((r) => r.data),
  });
}

export function useStores(params) {
  return useQuery({
    queryKey: adminKeys.stores(params),
    queryFn: ({ signal }) => api.stores({ ...params, signal }).then((r) => r.data),
  });
}

export function useStore(id) {
  return useQuery({
    queryKey: adminKeys.store(id),
    queryFn: ({ signal }) => api.store(id, { signal }).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useSellers() {
  return useQuery({
    queryKey: adminKeys.sellers,
    queryFn: ({ signal }) => api.sellers({ signal }).then((r) => r.data),
  });
}

export function useProducts(params) {
  return useQuery({
    queryKey: adminKeys.products(params),
    queryFn: ({ signal }) => api.products({ ...params, signal }).then((r) => r.data),
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: adminKeys.product(id),
    queryFn: ({ signal }) => api.product(id, { signal }).then((r) => r.data),
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: ({ signal }) => api.categories({ signal }).then((r) => r.data),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: adminKeys.brands,
    queryFn: ({ signal }) => api.brands({ signal }).then((r) => r.data),
  });
}

function useAdminMutation(fn, invalidations) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of invalidations) queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export const useApproveStore = () =>
  useAdminMutation((id) => api.approveStore(id), [
    adminKeys.dashboard,
    adminKeys.pendingStores,
    ["admin", "stores"],
    adminKeys.sellers,
  ]);

export const useRejectStore = () =>
  useAdminMutation((id) => api.rejectStore(id), [
    adminKeys.dashboard,
    adminKeys.pendingStores,
    ["admin", "stores"],
  ]);

export const useUpdateStore = () =>
  useAdminMutation(({ id, patch }) => api.updateStore(id, patch), [
    adminKeys.dashboard,
    ["admin", "stores"],
  ]);

export const useCreateProduct = () =>
  useAdminMutation((body) => api.createProduct(body), [adminKeys.dashboard, ["admin", "products"]]);

export const useUpdateProduct = () =>
  useAdminMutation(({ id, body }) => api.updateProduct(id, body), [
    adminKeys.dashboard,
    ["admin", "products"],
  ]);

export const useCreateCategory = () =>
  useAdminMutation((body) => api.createCategory(body), [adminKeys.categories]);

export const useUpdateCategory = () =>
  useAdminMutation(({ id, body }) => api.updateCategory(id, body), [adminKeys.categories]);

export const useCreateBrand = () =>
  useAdminMutation((body) => api.createBrand(body), [adminKeys.brands]);

export const useUpdateBrand = () =>
  useAdminMutation(({ id, body }) => api.updateBrand(id, body), [adminKeys.brands]);
