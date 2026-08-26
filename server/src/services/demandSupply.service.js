import { getPublicClient, getServiceClient } from "../config/supabase.js";
import { httpError } from "../utils/httpError.js";
import { boundingBox, haversineKm } from "../utils/geo.js";
import { getActiveBusinessCategoryBySlug, getMappedProductCategoryIds } from "./businessCategories.service.js";
import { discoverCompetitors } from "./competitors.service.js";

/**
 * Demand-Supply Gap analysis: "what are people searching for near this
 * location that current participating supply is failing to satisfy."
 * Combines real consumer_search_events (demand), store_products (supply)
 * and the existing hybrid competitor service -- never a fabricated number,
 * and every count is deterministic (no AI, no guessed categories).
 */

const TOP_QUERY_LIMIT = 10;

function failed(operation, error) {
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

function periodWindow(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { days, from: from.toISOString(), to: to.toISOString() };
}

/**
 * Rows within the bounding box, narrowed to a true radius via the same
 * haversine helper discovery.service.js and competitors.service.js already
 * use -- no third distance implementation. Rows with no coordinates (no
 * location was set at search time) are excluded rather than guessed either
 * way, since their proximity is genuinely unknown.
 */
function withinRadius(rows, { lat, lng, radiusKm, readLat, readLng }) {
  return rows.filter((row) => {
    const rowLat = readLat(row);
    const rowLng = readLng(row);
    if (rowLat == null || rowLng == null) return false;
    return haversineKm(lat, lng, Number(rowLat), Number(rowLng)) <= radiusKm;
  });
}

// -----------------------------------------------------------------------
// Demand: consumer_search_events
// -----------------------------------------------------------------------

async function loadRelevantSearchEvents({ lat, lng, radiusKm, mappedCategoryIds, period }) {
  const box = boundingBox(lat, lng, radiusKm);
  const client = getServiceClient();

  const { data, error } = await client
    .from("consumer_search_events")
    .select("normalized_query, result_count, available_store_count, location_lat, location_lng, created_at")
    .in("category_id", mappedCategoryIds)
    .gte("created_at", period.from)
    .not("location_lat", "is", null)
    .gte("location_lat", box.minLat)
    .lte("location_lat", box.maxLat)
    .gte("location_lng", box.minLng)
    .lte("location_lng", box.maxLng);

  if (error) throw failed("load consumer search demand", error);

  return withinRadius(data ?? [], {
    lat,
    lng,
    radiusKm,
    readLat: (row) => row.location_lat,
    readLng: (row) => row.location_lng,
  });
}

async function loadUnclassifiedZeroResultEvents({ lat, lng, radiusKm, period }) {
  const box = boundingBox(lat, lng, radiusKm);
  const client = getServiceClient();

  const { data, error } = await client
    .from("consumer_search_events")
    .select("normalized_query, location_lat, location_lng, created_at")
    .is("category_id", null)
    .eq("result_count", 0)
    .gte("created_at", period.from)
    .not("location_lat", "is", null)
    .gte("location_lat", box.minLat)
    .lte("location_lat", box.maxLat)
    .gte("location_lng", box.minLng)
    .lte("location_lng", box.maxLng);

  if (error) throw failed("load unclassified search demand", error);

  return withinRadius(data ?? [], {
    lat,
    lng,
    radiusKm,
    readLat: (row) => row.location_lat,
    readLng: (row) => row.location_lng,
  });
}

/** result_count = 0 OR available_store_count = 0 -- counted once per event, never both. */
function isUnmet(event) {
  return event.result_count === 0 || event.available_store_count === 0;
}

function isMatched(event) {
  return event.result_count > 0 && event.available_store_count != null && event.available_store_count > 0;
}

function summarizeDemand(events) {
  const totalRelevantSearches = events.length;
  const zeroResultSearches = events.filter((e) => e.result_count === 0).length;
  const noNearbyStoreSearches = events.filter((e) => e.available_store_count === 0).length;
  const unmetDemandEvents = events.filter(isUnmet).length;
  const matchedSearches = events.filter(isMatched).length;
  const uniqueDemandQueries = new Set(events.map((e) => e.normalized_query)).size;

  return {
    totalRelevantSearches,
    matchedSearches,
    zeroResultSearches,
    noNearbyStoreSearches,
    unmetDemandEvents,
    unmetDemandRate: totalRelevantSearches > 0 ? Math.round((unmetDemandEvents / totalRelevantSearches) * 10000) / 10000 : null,
    uniqueDemandQueries,
  };
}

function topUnmetQueries(events) {
  const byQuery = new Map();
  for (const event of events) {
    const group = byQuery.get(event.normalized_query) ?? {
      query: event.normalized_query,
      searches: 0,
      zeroResultSearches: 0,
      noStoreSearches: 0,
      unmetSearches: 0,
      availableStoreCountSum: 0,
      availableStoreCountCount: 0,
      latestSearchAt: event.created_at,
    };

    group.searches += 1;
    if (event.result_count === 0) group.zeroResultSearches += 1;
    if (event.available_store_count === 0) group.noStoreSearches += 1;
    if (isUnmet(event)) group.unmetSearches += 1;
    if (event.available_store_count != null) {
      group.availableStoreCountSum += event.available_store_count;
      group.availableStoreCountCount += 1;
    }
    if (event.created_at > group.latestSearchAt) group.latestSearchAt = event.created_at;

    byQuery.set(event.normalized_query, group);
  }

  return [...byQuery.values()]
    .map(({ availableStoreCountSum, availableStoreCountCount, ...rest }) => ({
      ...rest,
      averageAvailableStoreCount:
        availableStoreCountCount > 0 ? Math.round((availableStoreCountSum / availableStoreCountCount) * 100) / 100 : null,
    }))
    .sort((a, b) => b.unmetSearches - a.unmetSearches || b.searches - a.searches)
    .slice(0, TOP_QUERY_LIMIT);
}

function unclassifiedUnmetQueries(events) {
  const byQuery = new Map();
  for (const event of events) {
    byQuery.set(event.normalized_query, (byQuery.get(event.normalized_query) ?? 0) + 1);
  }
  return [...byQuery.entries()]
    .map(([query, searches]) => ({ query, searches }))
    .sort((a, b) => b.searches - a.searches)
    .slice(0, TOP_QUERY_LIMIT);
}

// -----------------------------------------------------------------------
// Supply: store_products, scoped to the mapped product categories
// -----------------------------------------------------------------------

async function loadParticipatingSupply({ lat, lng, radiusKm, mappedCategoryIds }) {
  const box = boundingBox(lat, lng, radiusKm);
  const client = getPublicClient();

  const { data, error } = await client
    .from("store_products")
    .select(`
      id, product_id, product_variant_id,
      product:products!inner (id, category_id),
      store:stores!inner (id, latitude, longitude)
    `)
    .in("product.category_id", mappedCategoryIds)
    .gte("store.latitude", box.minLat)
    .lte("store.latitude", box.maxLat)
    .gte("store.longitude", box.minLng)
    .lte("store.longitude", box.maxLng);

  if (error) throw failed("load participating supply", error);

  const withinRange = withinRadius(data ?? [], {
    lat,
    lng,
    radiusKm,
    readLat: (row) => row.store?.latitude,
    readLng: (row) => row.store?.longitude,
  });

  return {
    participatingStores: new Set(withinRange.map((row) => row.store.id)).size,
    relevantProductsAvailable: new Set(withinRange.map((row) => row.product_id)).size,
    relevantProductVariants: new Set(withinRange.map((row) => row.product_variant_id)).size,
    activeListings: withinRange.length,
  };
}

/**
 * The Opportunity Score's supply-gap component needs a real denominator:
 * how many catalogue products exist in this category's mapped product
 * categories at all, not just how many are visible nearby. A pure count,
 * unbounded by location -- the whole public catalogue, RLS-filtered same as
 * every other public.products read in this codebase (see catalogue.service.js).
 */
async function loadTotalRelevantCatalogueProducts(mappedCategoryIds) {
  const { count, error } = await getPublicClient()
    .from("products")
    .select("id", { count: "exact", head: true })
    .in("category_id", mappedCategoryIds);

  if (error) throw failed("count relevant catalogue products", error);
  return count ?? 0;
}

// -----------------------------------------------------------------------
// Secondary signal: product_demand_requests (explicit "notify me" asks)
// -----------------------------------------------------------------------

async function countExplicitProductRequests({ lat, lng, radiusKm, mappedCategoryIds, period }) {
  const box = boundingBox(lat, lng, radiusKm);
  const client = getServiceClient();

  const { data, error } = await client
    .from("product_demand_requests")
    .select("id, latitude, longitude, variant:product_variants (product_id)")
    .gte("created_at", period.from)
    .gte("latitude", box.minLat)
    .lte("latitude", box.maxLat)
    .gte("longitude", box.minLng)
    .lte("longitude", box.maxLng);

  if (error) throw failed("load explicit product requests", error);

  const inRadius = withinRadius(data ?? [], {
    lat,
    lng,
    radiusKm,
    readLat: (row) => row.latitude,
    readLng: (row) => row.longitude,
  });

  const productIds = [...new Set(inRadius.map((row) => row.variant?.product_id).filter(Boolean))];
  if (productIds.length === 0) return 0;

  const { data: products, error: productsError } = await client
    .from("products")
    .select("id, category_id")
    .in("id", productIds);
  if (productsError) throw failed("load requested product categories", productsError);

  const relevantProductIds = new Set(
    (products ?? []).filter((p) => mappedCategoryIds.includes(p.category_id)).map((p) => p.id),
  );

  return inRadius.filter((row) => relevantProductIds.has(row.variant?.product_id)).length;
}

// -----------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------

export async function analyzeDemandSupply({ lat, lng, radiusKm, categorySlug, days }) {
  const category = await getActiveBusinessCategoryBySlug(categorySlug);
  if (!category) throw httpError(400, "Unknown or inactive business category.");

  const period = periodWindow(days);
  const location = { latitude: lat, longitude: lng };

  const mappedCategoryIds = await getMappedProductCategoryIds(category.id);

  if (mappedCategoryIds.length === 0) {
    return {
      location,
      radiusKm,
      period,
      category: { slug: category.slug, name: category.name },
      analysisStatus: "category-mapping-unavailable",
    };
  }

  const [relevantEvents, unclassifiedEvents, supply, competitorResult, explicitProductRequests, totalRelevantCatalogueProducts] =
    await Promise.all([
      loadRelevantSearchEvents({ lat, lng, radiusKm, mappedCategoryIds, period }),
      loadUnclassifiedZeroResultEvents({ lat, lng, radiusKm, period }),
      loadParticipatingSupply({ lat, lng, radiusKm, mappedCategoryIds }),
      discoverCompetitors({ lat, lng, radiusKm, categorySlug }),
      countExplicitProductRequests({ lat, lng, radiusKm, mappedCategoryIds, period }),
      loadTotalRelevantCatalogueProducts(mappedCategoryIds),
    ]);

  const demand = summarizeDemand(relevantEvents);

  return {
    location,
    radiusKm,
    period,
    category: { slug: category.slug, name: category.name },
    analysisStatus: "ok",
    dataSufficiency: demand.totalRelevantSearches > 0 ? "available" : "no-data",
    demand,
    supply: {
      ...supply,
      // Additive fields only -- every existing consumer of `supply` keeps
      // working unchanged. null (not 0) when the catalogue denominator
      // itself is unknown, so a genuine "no relevant products exist at all"
      // is never confused with "we don't know" -- the mapped-categories
      // guard above already rules out an empty mappedCategoryIds list, so 0
      // here is a real, meaningful count, not a null-coalesced default.
      totalRelevantCatalogueProducts,
      catalogueCoverageRate:
        totalRelevantCatalogueProducts > 0 ? supply.relevantProductsAvailable / totalRelevantCatalogueProducts : null,
    },
    competition: {
      mappedCompetitors: competitorResult.summary.mappedCompetitors,
      kiranaConnectCompetitors: competitorResult.summary.kiranaConnectCompetitors,
      externalCompetitors: competitorResult.summary.externalCompetitors,
      competitionDensityPerSqKm: competitorResult.summary.competitionDensityPerSqKm,
      externalProviderStatus: competitorResult.externalProviderStatus,
    },
    topUnmetQueries: topUnmetQueries(relevantEvents),
    unclassifiedUnmetQueries: unclassifiedUnmetQueries(unclassifiedEvents),
    explicitProductRequests,
  };
}
