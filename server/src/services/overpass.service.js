import { env } from "../config/env.js";
import { createTtlCache } from "../utils/simpleCache.js";
import { osmShopTagsForCategory } from "../config/osmCategoryMapping.js";

/**
 * ExternalBusinessProvider: the one place that talks to Overpass. The query
 * is always built here from a trusted category -> shop-tag mapping, never
 * from anything a client supplies directly -- there is no code path that
 * accepts a raw Overpass query string from a request.
 */

const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 20 * 60_000; // 20 minutes, within the 10-30 min guidance.

// Rounded to ~111 m so nearby, functionally-identical requests share a cache
// entry instead of each missing by a fraction of a metre.
const CACHE_COORD_PRECISION = 3;

const cache = createTtlCache({ ttlMs: CACHE_TTL_MS });

function cacheKey({ lat, lng, radiusKm, categorySlug }) {
  const roundedLat = lat.toFixed(CACHE_COORD_PRECISION);
  const roundedLng = lng.toFixed(CACHE_COORD_PRECISION);
  return `overpass:${categorySlug}:${roundedLat}:${roundedLng}:${radiusKm}`;
}

function buildOverpassQuery({ lat, lng, radiusMetres, shopTags }) {
  // A single regex-alternation filter per element type, rather than one
  // clause per tag value, keeps the query short and easy to read even as the
  // mapping grows.
  const tagPattern = shopTags.map((tag) => tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const around = `(around:${radiusMetres},${lat},${lng})`;

  return `
    [out:json][timeout:20];
    (
      node["shop"~"^(${tagPattern})$"]${around};
      way["shop"~"^(${tagPattern})$"]${around};
    );
    out center tags;
  `.trim();
}

function composeAddress(tags) {
  if (!tags) return null;
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] ?? tags["addr:neighbourhood"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/**
 * Raw Overpass elements shaped into the same small, public-safe fields
 * regardless of caller -- never the full tags object, which can carry
 * arbitrary and sometimes large OSM metadata.
 */
function normalizeElement(element) {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const tags = element.tags ?? {};

  return {
    externalId: `${element.type}/${element.id}`,
    name: tags.name?.trim() || null,
    latitude: lat,
    longitude: lng,
    externalType: tags.shop ?? null,
    address: composeAddress(tags),
    openingHours: tags.opening_hours ?? null,
    source: "openstreetmap",
    categoryMatchSource: "openstreetmap-tag",
  };
}

/**
 * Queries Overpass for shops matching the given business category near a
 * point. Returns [] on any provider failure rather than throwing -- an
 * external-mapping outage must degrade the report, not break it (the caller
 * is responsible for surfacing externalProviderStatus to the client).
 */
export async function findExternalBusinesses({ lat, lng, radiusKm, categorySlug }) {
  const shopTags = osmShopTagsForCategory(categorySlug);
  if (shopTags.length === 0) return { businesses: [], status: "ok" };

  const key = cacheKey({ lat, lng, radiusKm, categorySlug });
  const cached = cache.get(key);
  if (cached) return { businesses: cached, status: "ok" };

  const query = buildOverpassQuery({ lat, lng, radiusMetres: Math.round(radiusKm * 1000), shopTags });

  let response;
  try {
    response = await fetch(env.osmOverpassUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": env.osmUserAgent,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[kirana-connect-api] Overpass request failed:", error.message);
    return { businesses: [], status: "unavailable" };
  }

  if (!response.ok) {
    console.error("[kirana-connect-api] Overpass responded with status", response.status);
    return { businesses: [], status: "unavailable" };
  }

  const payload = await response.json().catch(() => null);
  const elements = Array.isArray(payload?.elements) ? payload.elements : null;
  if (!elements) {
    console.error("[kirana-connect-api] Overpass response was not valid JSON.");
    return { businesses: [], status: "unavailable" };
  }

  const businesses = elements.map(normalizeElement).filter(Boolean);
  cache.set(key, businesses);
  return { businesses, status: "ok" };
}
