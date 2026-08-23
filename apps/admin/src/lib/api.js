import { supabase } from "./supabase.js";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function authHeader() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withParams(path, params) {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

async function request(path, { method = "GET", body, signal, params } = {}) {
  const headers = { Accept: "application/json", ...(await authHeader()) };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${BASE_URL}/api/admin${withParams(path, params)}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    if (cause?.name === "AbortError" || signal?.aborted) throw cause;
    throw new ApiError("Could not reach the Kirana Connect API.", 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? "Something went wrong. Please try again.",
      response.status,
      payload?.data,
    );
  }

  return { data: payload.data, meta: payload.meta };
}

async function upload(path, file) {
  const headers = { Accept: "application/json", ...(await authHeader()) };
  if (file?.type) headers["Content-Type"] = file.type;

  let response;
  try {
    response = await fetch(`${BASE_URL}/api/admin${path}`, {
      method: "POST",
      headers,
      body: file,
    });
  } catch (cause) {
    if (cause?.name === "AbortError") throw cause;
    throw new ApiError("Could not reach the Kirana Connect API.", 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? "Upload failed. Please try again.",
      response.status,
      payload?.data,
    );
  }

  return { data: payload.data, meta: payload.meta };
}

export const api = {
  me: (options) => request("/me", options),
  dashboard: (options) => request("/dashboard", options),

  pendingStores: (options) => request("/stores/pending", options),
  pendingStoreChanges: (options) => request("/store-changes/pending", options),
  stores: ({ signal, ...params } = {}) => request("/stores", { signal, params }),
  store: (id, options) => request(`/stores/${id}`, options),
  approveStore: (id) => request(`/stores/${id}/approve`, { method: "POST" }),
  rejectStore: (id) => request(`/stores/${id}/reject`, { method: "POST" }),
  approveStoreChange: (id) => request(`/store-changes/${id}/approve`, { method: "POST" }),
  rejectStoreChange: (id) => request(`/store-changes/${id}/reject`, { method: "POST" }),
  updateStore: (id, body) => request(`/stores/${id}`, { method: "PATCH", body }),

  sellers: (options) => request("/sellers", options),

  products: ({ signal, ...params } = {}) => request("/products", { signal, params }),
  product: (id, options) => request(`/products/${id}`, options),
  uploadProductImage: (file) => upload("/product-images", file),
  createProduct: (body) => request("/products", { method: "POST", body }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: "PATCH", body }),

  categories: (options) => request("/categories", options),
  createCategory: (body) => request("/categories", { method: "POST", body }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: "PATCH", body }),

  brands: (options) => request("/brands", options),
  createBrand: (body) => request("/brands", { method: "POST", body }),
  updateBrand: (id, body) => request(`/brands/${id}`, { method: "PATCH", body }),
};
