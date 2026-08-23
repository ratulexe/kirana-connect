import { httpError } from "../utils/httpError.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function lookup(query) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "KiranaConnect/0.1 (https://github.com/ratulexe/kirana-connect)",
    },
  });

  if (!response.ok) {
    throw httpError(502, "The location lookup service is unavailable.");
  }

  const matches = await response.json().catch(() => []);
  const match = Array.isArray(matches) ? matches[0] : null;
  const lat = Number(match?.lat);
  const lng = Number(match?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    label: match.display_name ?? query,
  };
}

/**
 * Looks up an Indian address and returns the best coordinate match.
 *
 * Store owners can still drag the pin after this; geocoding is a starting
 * point, not proof of a shop-front location.
 */
export async function geocodeIndianAddress(query) {
  try {
    const queries = candidateQueries(query);
    for (const [index, candidate] of queries.entries()) {
      if (index > 0) await sleep(1100);

      const result = await lookup(candidate);
      if (result) return result;
    }
  } catch (error) {
    if (error?.status) throw error;
    throw httpError(502, "Could not reach the location lookup service.");
  }

  return null;
}
