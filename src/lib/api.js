/**
 * Thin client for the Kirana Connect Express API.
 *
 * Customer discovery reads go React -> Express -> Supabase. The frontend
 * Supabase client stays reserved for auth and other client-side Supabase work,
 * so discovery components must not query the database directly.
 */

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

export const apiBaseUrl = BASE_URL;
