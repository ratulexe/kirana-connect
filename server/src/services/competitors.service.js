import { getPublicClient } from "../config/supabase.js";
import { httpError, badRequest } from "../utils/httpError.js";
import { boundingBox, haversineKm, roundKm } from "../utils/geo.js";
import { findExternalBusinesses } from "./overpass.service.js";

/**
 * Competitor Discovery Service: combines Kirana Connect's own store
 * database with OpenStreetMap-mapped businesses into one hybrid,
 * deduplicated competitor dataset. Two independent sources feed one
 * pipeline: normalize -> radius-filter (server-side, never trusting a
 * provider's own filtering) -> deduplicate -> density.
 */

function failed(operation, error) {
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

async function resolveCategoryBySlug(slug) {
  const { data, error } = await getPublicClient()
    .from("business_categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw failed("load that business category", error);
  if (!data) throw badRequest("Unknown or inactive business category.");
  return data;
}

/**
 * Kirana Connect's own stores classified into this category, within radius.
 * Reuses the exact bounding-box + haversine pattern discovery.service.js
 * already uses for nearby-store search, rather than a second inconsistent
 * distance implementation. Runs through the anon-key public client, so the
 * same RLS that governs every other public read (store_is_public,
 * stores_select_public) is what decides visibility here too -- no store
 * gains extra exposure just because this is a new endpoint.
 */
async function findKiranaConnectCompetitors({ lat, lng, radiusKm, categoryId }) {
  const client = getPublicClient();
  const box = boundingBox(lat, lng, radiusKm);

  const { data, error } = await client
    .from("store_business_categories")
    .select("is_primary, store:stores!inner (id, name, slug, latitude, longitude)")
    .eq("business_category_id", categoryId)
    .gte("store.latitude", box.minLat)
    .lte("store.latitude", box.maxLat)
    .gte("store.longitude", box.minLng)
    .lte("store.longitude", box.maxLng);

  if (error) throw failed("load nearby Kirana Connect competitors", error);

  return (data ?? [])
    .filter((row) => row.store?.latitude != null && row.store?.longitude != null)
    .map((row) => {
      const distanceKm = haversineKm(lat, lng, Number(row.store.latitude), Number(row.store.longitude));
      return { row, distanceKm };
    })
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .map(({ row, distanceKm }) => ({
      id: row.store.id,
      name: row.store.name,
      slug: row.store.slug,
      source: "kirana-connect",
      latitude: Number(row.store.latitude),
      longitude: Number(row.store.longitude),
      distanceKm: roundKm(distanceKm),
      competitionRelation: row.is_primary ? "primary" : "overlap",
    }));
}

/**
 * External Overpass results, final-filtered by the same real haversine
 * distance rather than trusting Overpass's own `around` radius, which is
 * approximate and computed on the provider's side, not verified here.
 */
async function findAndFilterExternalBusinesses({ lat, lng, radiusKm, categorySlug, categoryName }) {
  const { businesses, status } = await findExternalBusinesses({ lat, lng, radiusKm, categorySlug });

  const withinRadius = businesses
    .map((business) => ({
      business,
      distanceKm: haversineKm(lat, lng, business.latitude, business.longitude),
    }))
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .map(({ business, distanceKm }) => ({
      id: business.externalId,
      name: business.name,
      source: "openstreetmap",
      latitude: business.latitude,
      longitude: business.longitude,
      distanceKm: roundKm(distanceKm),
      businessCategory: categoryName,
      externalType: business.externalType,
      categoryMatchSource: business.categoryMatchSource,
      address: business.address,
      openingHours: business.openingHours,
    }));

  return { businesses: withinRadius, status };
}

// -----------------------------------------------------------------------
// Deduplication
// -----------------------------------------------------------------------

const DUPLICATE_DISTANCE_KM = 0.1; // ~100 m

/**
 * lowercase, trim, collapse whitespace, drop punctuation. Deliberately
 * conservative: no stemming, no word removal, nothing that could make two
 * unrelated businesses collide. "Saha Stores" and "saha  stores." normalize
 * to the same string; "Saha Stores" and "Sen Stores" do not.
 */
function normalizeName(name) {
  return (name ?? "")
    .toLowerCase()
    .trim()
    .replace(/[.,'"()\-–_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function namesStronglyMatch(a, b) {
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  // Containment catches "Saha Kirana Store" vs "Saha Kirana" without
  // touching individual words, which a token-overlap heuristic would risk
  // matching on a single common word like "store".
  return normA.includes(normB) || normB.includes(normA);
}

/**
 * A Kirana Connect record wins over an external one representing the same
 * real store: it carries richer first-party data (verified status, real
 * inventory) that external mapping data can never provide, and section 23
 * of this milestone's spec is explicit that Kirana Connect's own values must
 * never be overwritten by an external source. The external record is
 * dropped from the list; its presence is preserved only as a note on the
 * surviving Kirana Connect record.
 */
export function mergeDuplicates(kiranaConnectCompetitors, externalCompetitors) {
  const survivingExternal = [];
  const externalSourcesByKcId = new Map();

  for (const external of externalCompetitors) {
    const duplicateOf = kiranaConnectCompetitors.find(
      (kc) =>
        haversineKm(kc.latitude, kc.longitude, external.latitude, external.longitude) <= DUPLICATE_DISTANCE_KM &&
        namesStronglyMatch(kc.name, external.name),
    );

    if (duplicateOf) {
      const sources = externalSourcesByKcId.get(duplicateOf.id) ?? new Set();
      sources.add(external.source);
      externalSourcesByKcId.set(duplicateOf.id, sources);
      continue;
    }

    survivingExternal.push(external);
  }

  const mergedKiranaConnect = kiranaConnectCompetitors.map((kc) => {
    const sources = externalSourcesByKcId.get(kc.id);
    return sources ? { ...kc, externalSources: [...sources] } : kc;
  });

  return { kiranaConnectCompetitors: mergedKiranaConnect, externalCompetitors: survivingExternal };
}

// -----------------------------------------------------------------------
// Density
// -----------------------------------------------------------------------

/** analysis area (pi * r^2) is the only formula here; no scoring, no weights. */
function competitionDensityPerSqKm(mappedCompetitorCount, radiusKm) {
  const areaSqKm = Math.PI * radiusKm ** 2;
  if (areaSqKm <= 0) return 0;
  return Math.round((mappedCompetitorCount / areaSqKm) * 1000) / 1000;
}

/**
 * The full hybrid pipeline: Kirana Connect + OpenStreetMap -> normalize ->
 * radius filter -> deduplicate -> unified dataset + summary. Never throws
 * for an external-provider failure -- externalProviderStatus carries that,
 * and Kirana Connect results (if any) are still returned. A Supabase
 * failure, by contrast, is a real error and is allowed to throw.
 */
export async function discoverCompetitors({ lat, lng, radiusKm, categorySlug }) {
  const category = await resolveCategoryBySlug(categorySlug);

  const [kiranaConnectCompetitors, external] = await Promise.all([
    findKiranaConnectCompetitors({ lat, lng, radiusKm, categoryId: category.id }),
    findAndFilterExternalBusinesses({ lat, lng, radiusKm, categorySlug, categoryName: category.name }),
  ]);

  const { kiranaConnectCompetitors: dedupedKc, externalCompetitors: dedupedExternal } = mergeDuplicates(
    kiranaConnectCompetitors,
    external.businesses,
  );

  const competitors = [...dedupedKc, ...dedupedExternal].sort((a, b) => a.distanceKm - b.distanceKm);
  const unnamedExternalCount = dedupedExternal.filter((business) => !business.name).length;
  const mappedCompetitorCount = competitors.length;

  return {
    category,
    summary: {
      mappedCompetitors: mappedCompetitorCount,
      kiranaConnectCompetitors: dedupedKc.length,
      externalCompetitors: dedupedExternal.length,
      unnamedExternalBusinesses: unnamedExternalCount,
      competitionDensityPerSqKm: competitionDensityPerSqKm(mappedCompetitorCount, radiusKm),
    },
    competitors,
    externalProviderStatus: external.status,
    sources: ["kirana-connect", "openstreetmap"],
  };
}
