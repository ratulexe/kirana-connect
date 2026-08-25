/**
 * Thin client for the Kirana Connect Express API.
 *
 * Customer discovery reads go React -> Express -> Supabase. The frontend
 * Supabase client stays reserved for auth and other client-side Supabase work,
 * so discovery components must not query the database directly.
 */

import { supabase } from "./supabase.js";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Reads the current access token straight from Supabase at call time, rather
 * than copying it into app state where it would only go stale.
 */
async function authHeader() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}/api${path}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Performs a GET and unwraps the API's { success, data, meta } envelope.
 */
export async function apiGet(path, { params, signal } = {}) {
  let response;

  try {
    response = await fetch(buildUrl(path, params), {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (cause) {
    // A cancelled request is not a failure. React Query aborts in-flight
    // queries routinely, and rewriting that into a network error would both
    // mislead the UI and defeat its cancellation handling.
    if (cause?.name === "AbortError" || signal?.aborted) throw cause;

    // Otherwise fetch only rejects on network-level failure, which in practice
    // means the API is not running rather than that the request was invalid.
    throw new ApiError("Could not reach the Kirana Connect API.", 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return { data: payload.data, meta: payload.meta };
}

/**
 * Performs an authenticated POST and unwraps the same envelope as apiGet.
 * Used only by the small set of writes that need a signed-in customer, such
 * as demand requests -- most of the app stays read-only against this client.
 */
export async function apiPost(path, body) {
  let response;

  try {
    response = await fetch(buildUrl(path), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(await authHeader()),
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError("Could not reach the Kirana Connect API.", 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return { data: payload.data };
}

export const apiBaseUrl = BASE_URL;
