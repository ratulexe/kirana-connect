import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";

export const adminKeys = {
  me: ["admin", "me"],
  dashboard: ["admin", "dashboard"],
  pendingStores: ["admin", "stores", "pending"],
  pendingStoreChanges: ["admin", "store-changes", "pending"],
  stores: (params = {}) => ["admin", "stores", params],
  store: (id) => ["admin", "stores", id],
  sellers: ["admin", "sellers"],
  products: (params = {}) => ["admin", "products", params],
  productSummary: ["admin", "products", "summary"],
  product: (id) => ["admin", "products", id],
  productMedia: (productId) => ["admin", "products", productId, "media"],
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

export function usePendingStoreChanges() {
  return useQuery({
    queryKey: adminKeys.pendingStoreChanges,
    queryFn: ({ signal }) => api.pendingStoreChanges({ signal }).then((r) => r.data),
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

export function useProducts(params, options = {}) {
  return useQuery({
    queryKey: adminKeys.products(params),
    queryFn: ({ signal }) => api.products({ ...params, signal }).then((r) => r.data),
    ...options,
  });
}

export function useProductSummary() {
  return useQuery({
    queryKey: adminKeys.productSummary,
    queryFn: ({ signal }) => api.productSummary({ signal }).then((r) => r.data),
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

export const useApproveStoreChange = () =>
  useAdminMutation((id) => api.approveStoreChange(id), [
    adminKeys.dashboard,
    adminKeys.pendingStoreChanges,
    ["admin", "stores"],
  ]);

export const useRejectStoreChange = () =>
  useAdminMutation((id) => api.rejectStoreChange(id), [
    adminKeys.dashboard,
    adminKeys.pendingStoreChanges,
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

export const useUploadProductImage = () =>
  useMutation({
    mutationFn: (file) => api.uploadProductImage(file).then((r) => r.data),
  });

export const useResolveProductImage = () =>
  useMutation({
    mutationFn: (imageUrl) => api.resolveProductImage(imageUrl).then((r) => r.data),
  });

export const useCreateCategory = () =>
  useAdminMutation((body) => api.createCategory(body), [adminKeys.categories]);

export const useUpdateCategory = () =>
  useAdminMutation(({ id, body }) => api.updateCategory(id, body), [adminKeys.categories]);

export const useCreateBrand = () =>
  useAdminMutation((body) => api.createBrand(body), [adminKeys.brands]);

export const useUpdateBrand = () =>
  useAdminMutation(({ id, body }) => api.updateBrand(id, body), [adminKeys.brands]);

export function useProductMedia(productId) {
  return useQuery({
    queryKey: adminKeys.productMedia(productId),
    queryFn: ({ signal }) => api.productMedia(productId, { signal }).then((r) => r.data),
    enabled: Boolean(productId),
  });
}

export const useCreateProductMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, file, metadata }) => api.createProductMedia(productId, file, metadata).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.productMedia(variables.productId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.product(variables.productId) });
    },
  });
};

export const useUpdateProductMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.updateProductMedia(id, body).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.productMedia(data.product_id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.product(data.product_id) });
    },
  });
};

export const useDeleteProductMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => api.deleteProductMedia(id).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.productMedia(variables.productId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.product(variables.productId) });
    },
  });
};
