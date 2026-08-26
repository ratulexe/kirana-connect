/**
 * Shared base URL for the small set of plain-fetch backend calls Portal
 * makes (business categories, location resolution, competitor discovery).
 * Portal has no data layer / auth today, so these stay plain fetch rather
 * than pulling in a client used by other apps for authenticated requests.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

// A production build with no VITE_API_BASE_URL set would otherwise fail
// silently -- every request would target an unreachable localhost with no
// clue why. This is a diagnostic only; behaviour is unchanged.
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    "[kirana-connect-portal] VITE_API_BASE_URL is not set in this production build -- API calls will target localhost:5000 and fail. Set it in the Vercel project's environment variables.",
  );
}

export async function apiGet(path, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message ?? "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }

  return payload.data;
}

export async function apiPost(path, body, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message ?? "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }

  return payload.data;
}
