import { getLocationAutocompleteProvider } from "./locationAutocompleteProvider.js";
import { createTtlCache } from "../utils/simpleCache.js";

/**
 * Orchestrates the location-suggestions endpoint: picks the configured
 * provider, applies a short cache so repeated identical keystrokes (typing
 * then deleting then retyping the same prefix) don't re-spend provider
 * quota, and normalizes the "no provider configured" case to a status the
 * controller can render without throwing.
 */

const CACHE_TTL_MS = 2 * 60_000; // short: a prefix search result set is cheap to refetch and shouldn't feel stale for long
const cache = createTtlCache({ ttlMs: CACHE_TTL_MS });

/**
 * query is already validated/trimmed/length-checked by the controller.
 * Returns { status: "ok", suggestions } | { status: "not-configured", suggestions: [] }
 * | { status: "unavailable", suggestions: [] }. Never throws.
 */
export async function getLocationSuggestions(query, { limit }) {
  const provider = getLocationAutocompleteProvider();
  if (!provider) return { status: "not-configured", suggestions: [] };

  const cacheKey = `${provider.name}:${query.toLowerCase()}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return { status: "ok", suggestions: cached };

  const result = await provider.search(query, { limit });
  if (result.status !== "ok") return { status: "unavailable", suggestions: [] };

  cache.set(cacheKey, result.suggestions);
  return { status: "ok", suggestions: result.suggestions };
}
