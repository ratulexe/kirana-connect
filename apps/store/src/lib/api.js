import { supabase } from "./supabase.js";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Reads the current access token straight from Supabase at call time.
 *
 * The token is deliberately never copied into React state, a store, or
 * localStorage by this app: Supabase already persists and refreshes it, and a
 * second copy would only go stale and widen the blast radius. It is also never
 * logged.
 */
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

async function request(path, { method = "GET", body, signal, auth = true, params } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, await authHeader());

  let response;
  try {
    response = await fetch(`${BASE_URL}/api${withParams(path, params)}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    // A cancelled request is not a failure; rewriting it would defeat React
    // Query's own cancellation handling.
    if (cause?.name === "AbortError" || signal?.aborted) throw cause;
    throw new ApiError("Could not reach Kirana Connect. Check your connection.", 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? "Something went wrong. Please try again.",
      response.status,
      payload?.data,
    );
  }

  return payload.data;
}

export const api = {
  getOnboardingStatus: (options) => request("/store-onboarding/status", options),
  geocodeStoreAddress: ({ q, signal }) =>
    request("/store-onboarding/geocode", { params: { q }, signal }),
  submitStore: (body) => request("/store-onboarding", { method: "POST", body }),
  submitStoreChange: (storeId, body) =>
    request(`/store-onboarding/stores/${storeId}/changes`, { method: "POST", body }),

  getInventory: ({ storeId, signal } = {}) =>
    request("/store-inventory", { signal, params: { store_id: storeId } }),
  addInventoryItem: ({ storeId, body }) =>
    request("/store-inventory", { method: "POST", params: { store_id: storeId }, body }),
  updateInventoryItem: ({ itemId, storeId, body }) =>
    request(`/store-inventory/${itemId}`, { method: "PATCH", params: { store_id: storeId }, body }),
  removeInventoryItem: ({ itemId, storeId }) =>
    request(`/store-inventory/${itemId}`, { method: "DELETE", params: { store_id: storeId } }),

  // The catalogue is public, so this one deliberately carries no token.
  searchCatalogue: ({ q, limit = 12, signal }) =>
    request("/products", { auth: false, signal, params: { q, limit } }),
};
