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

async function request(path, { method = "GET", body, signal, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, await authHeader());

  let response;
  try {
    response = await fetch(`${BASE_URL}/api${path}`, {
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
  submitStore: (body) => request("/store-onboarding", { method: "POST", body }),
};
