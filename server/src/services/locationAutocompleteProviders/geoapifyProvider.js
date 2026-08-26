/**
 * The one place that talks to Geoapify's Address Autocomplete API. Endpoint
 * and response shape verified against the current (August 2026) official
 * docs before writing this. Deliberately separate from
 * geocoding.service.js's Nominatim integration -- Nominatim's public-instance
 * usage policy does not permit autocomplete/keystroke traffic, so that
 * integration stays reserved for explicit final-submit resolution only.
 */

const REQUEST_TIMEOUT_MS = 6000;
const API_ROOT = "https://api.geoapify.com/v1/geocode/autocomplete";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Never fabricates a field: only what Geoapify genuinely returned for this
 * result is included, everything else is null rather than guessed.
 */
function normalizeResult(result, index) {
  const lat = toNumber(result.lat);
  const lon = toNumber(result.lon);
  if (lat === null || lon === null) return null;

  const label = str(result.formatted);
  if (!label) return null;

  return {
    id: str(result.place_id) ?? `${lat},${lon},${index}`,
    label,
    name: str(result.name),
    locality: str(result.suburb),
    city: str(result.city),
    district: str(result.county),
    state: str(result.state),
    postcode: str(result.postcode),
    country: str(result.country),
    latitude: lat,
    longitude: lon,
  };
}

/**
 * (query, { limit, apiKey }) -> { status: "ok", suggestions } | { status: "unavailable" }
 * Never throws -- a provider outage must degrade the field to plain manual
 * entry, never break the form.
 */
export async function searchWithGeoapify(query, { limit, apiKey }) {
  const url = new URL(API_ROOT);
  url.searchParams.set("text", query);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("filter", "countrycode:in");
  url.searchParams.set("limit", String(limit));

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      console.error("[kirana-connect-api] location autocomplete request timed out");
    } else {
      console.error("[kirana-connect-api] location autocomplete request failed to reach the provider");
    }
    return { status: "unavailable", suggestions: [] };
  }

  if (!response.ok) {
    console.error(`[kirana-connect-api] location autocomplete provider responded with status ${response.status}`);
    return { status: "unavailable", suggestions: [] };
  }

  const payload = await response.json().catch(() => null);
  const results = Array.isArray(payload?.results) ? payload.results : [];

  return {
    status: "ok",
    suggestions: results.map(normalizeResult).filter(Boolean).slice(0, limit),
  };
}
