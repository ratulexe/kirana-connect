import { httpError } from "../utils/httpError.js";
import { env } from "../config/env.js";

// LocationProvider: the one place that talks to the OpenStreetMap-compatible
// geocoder (Nominatim). Nothing else in the backend, and nothing in any
// frontend, calls it directly -- centralizing this is what lets rate
// limiting, headers and error handling live in one spot, and lets the
// provider be swapped later without touching a caller.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const REQUEST_TIMEOUT_MS = 8000;

async function queryNominatim(query, { limit }) {
  const url = new URL(env.osmNominatimUrl);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  // India-biased, not India-hard-coded: countrycodes restricts results to
  // India without assuming any particular state or town, so the same lookup
  // works for an entrepreneur anywhere in the country.
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", query);

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": env.osmUserAgent },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw httpError(502, "Could not reach the location lookup service.");
  }

  if (!response.ok) {
    throw httpError(502, "The location lookup service is unavailable.");
  }

  const matches = await response.json().catch(() => []);
  return Array.isArray(matches) ? matches : [];
}

function toResult(match) {
  const lat = Number(match?.lat);
  const lng = Number(match?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    label: match.display_name ?? "",
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
  };
}

function candidateQueries(query) {
  const parts = query
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 4) return [query];

  return [
    query,
    // If a shop/building name is not mapped yet, the locality/postal-code level
    // lookup is still much closer than a desktop browser's IP-based fix.
    parts.slice(2).join(", "),
  ];
}

/**
 * Looks up an Indian address and returns the single best coordinate match,
 * falling back to a looser query if the full address does not resolve.
 * Used by store onboarding, where "close enough, the owner can drag the pin"
 * is the right tradeoff.
 */
export async function geocodeIndianAddress(query) {
  try {
    for (const [index, candidate] of candidateQueries(query).entries()) {
      if (index > 0) await sleep(1100);

      const matches = await queryNominatim(candidate, { limit: 1 });
      const result = toResult(matches[0]);
      if (result) return result;
    }
  } catch (error) {
    if (error?.status) throw error;
    throw httpError(502, "Could not reach the location lookup service.");
  }

  return null;
}

const MAX_LOCATION_CANDIDATES = 5;

/**
 * Resolves a free-text place into a short list of real candidates, for the
 * Entrepreneur flow's "confirm your location" step. Deliberately does NOT
 * use geocodeIndianAddress's progressive-fallback-to-a-shorter-query
 * behaviour: an ambiguous or unresolved entrepreneur location should surface
 * as "not found" or "which of these," never silently substitute a looser
 * match the user never confirmed. No coordinates are ever fabricated --
 * an empty array means the geocoder found nothing.
 */
export async function resolveLocationCandidates(query) {
  const matches = await queryNominatim(query, { limit: MAX_LOCATION_CANDIDATES });
  return matches.map(toResult).filter(Boolean);
}
