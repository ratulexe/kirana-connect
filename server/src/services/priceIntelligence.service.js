import { getPublicClient, getServiceClient } from "../config/supabase.js";
import { httpError } from "../utils/httpError.js";
import { boundingBox, haversineKm } from "../utils/geo.js";
import { getActiveBusinessCategoryBySlug, getMappedProductCategoryIds } from "./businessCategories.service.js";

/**
 * Local Product Market Value: real observed retail prices across
 * participating Kirana Connect stores, grouped per product variant so a
 * 500 ml pack is never averaged together with a 1 L pack of the same
 * product. Deliberately NOT "pricing strategy" or "purchasing power" --
 * this project has real first-party price data but no verified household
 * purchasing-power dataset, so it stops at what the data actually supports:
 * an observed local selling range.
 */

const SHORTLIST_LIMIT = 15;
// 0 observations: nothing to show. 1: real, but a single store's price is
// not yet a "local range" -- shown as limited. 2+: enough for a genuine
// min/max/median comparison. Matches the exact thresholds given for this
// milestone; documented here rather than left implicit.
const LIMITED_DATA_MAX_OBSERVATIONS = 1;

function failed(operation, error) {
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

function median(sortedNumbers) {
  const n = sortedNumbers.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sortedNumbers[mid - 1] + sortedNumbers[mid]) / 2 : sortedNumbers[mid];
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function withinRadius(rows, { lat, lng, radiusKm, readLat, readLng }) {
  return rows.filter((row) => {
    const rowLat = readLat(row);
    const rowLng = readLng(row);
    if (rowLat == null || rowLng == null) return false;
    return haversineKm(lat, lng, Number(rowLat), Number(rowLng)) <= radiusKm;
  });
}

/**
 * Same store_products -> products -> stores join and bounding-box ->
 * haversine radius pattern demandSupply.service.js already uses for
 * participating supply, extended here with the fields price analysis
 * actually needs (selling_price, the variant's own mrp/label/product name).
 * Runs through the anon-key public client, so the same RLS that governs
 * every other public read decides visibility here too.
 */
async function loadEligibleListings({ lat, lng, radiusKm, mappedCategoryIds }) {
  const box = boundingBox(lat, lng, radiusKm);
  const client = getPublicClient();

  const { data, error } = await client
    .from("store_products")
    .select(`
      id, selling_price, product_id, product_variant_id, store_id,
      product:products!inner (id, name, category_id),
      variant:product_variants!store_products_product_variant_id_fkey (id, mrp, unit_label),
      store:stores!inner (id, latitude, longitude)
    `)
    .in("product.category_id", mappedCategoryIds)
    .gte("store.latitude", box.minLat)
    .lte("store.latitude", box.maxLat)
    .gte("store.longitude", box.minLng)
    .lte("store.longitude", box.maxLng);

  if (error) throw failed("load local price observations", error);

  return withinRadius(data ?? [], {
    lat,
    lng,
    radiusKm,
    readLat: (row) => row.store?.latitude,
    readLng: (row) => row.store?.longitude,
  });
}

function groupByVariant(listings) {
  const groups = new Map();

  for (const listing of listings) {
    const key = listing.product_variant_id;
    const group = groups.get(key) ?? {
      productId: listing.product_id,
      productVariantId: key,
      productName: listing.product?.name ?? "Unknown product",
      variantLabel: listing.variant?.unit_label ?? "",
      mrp: listing.variant?.mrp != null ? Number(listing.variant.mrp) : null,
      prices: [],
      storeIds: new Set(),
    };

    group.prices.push(Number(listing.selling_price));
    group.storeIds.add(listing.store_id);
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => {
    const sorted = [...group.prices].sort((a, b) => a - b);
    const minPrice = sorted[0];
    const maxPrice = sorted[sorted.length - 1];
    return {
      productId: group.productId,
      productVariantId: group.productVariantId,
      productName: group.productName,
      variantLabel: group.variantLabel,
      observations: sorted.length,
      storesRepresented: group.storeIds.size,
      minPrice: round2(minPrice),
      maxPrice: round2(maxPrice),
      averagePrice: round2(sorted.reduce((sum, p) => sum + p, 0) / sorted.length),
      medianPrice: round2(median(sorted)),
      mrp: group.mrp !== null ? round2(group.mrp) : null,
      localPriceSpread: round2(maxPrice - minPrice),
    };
  });
}

/**
 * Real search-demand context per shortlisted product, reusing the exact
 * same category_id linkage rule consumer_search_events already enforces at
 * write time: a search only carries a product_id when it unambiguously
 * resolved to exactly one product. Correlating on that id is therefore
 * never a guess -- unlike matching free-text queries to products, which
 * this deliberately does not attempt.
 */
async function attachObservedSearches(products, { lat, lng, radiusKm, period }) {
  const productIds = [...new Set(products.map((p) => p.productId))];
  if (productIds.length === 0) return products;

  const box = boundingBox(lat, lng, radiusKm);
  const client = getServiceClient();

  const { data, error } = await client
    .from("consumer_search_events")
    .select("product_id, location_lat, location_lng")
    .in("product_id", productIds)
    .gte("created_at", period.from)
    .not("location_lat", "is", null)
    .gte("location_lat", box.minLat)
    .lte("location_lat", box.maxLat)
    .gte("location_lng", box.minLng)
    .lte("location_lng", box.maxLng);

  if (error) {
    // Demand context is a bonus on top of real price data, not a
    // requirement -- a failure here should not take down price
    // intelligence that already succeeded.
    console.error("[kirana-connect-api] load observed searches for price intelligence failed:", error.message);
    return products.map((p) => ({ ...p, observedSearches: null }));
  }

  const inRadius = withinRadius(data ?? [], {
    lat,
    lng,
    radiusKm,
    readLat: (row) => row.location_lat,
    readLng: (row) => row.location_lng,
  });

  const countsByProduct = new Map();
  for (const row of inRadius) {
    countsByProduct.set(row.product_id, (countsByProduct.get(row.product_id) ?? 0) + 1);
  }

  return products.map((p) => ({ ...p, observedSearches: countsByProduct.get(p.productId) ?? null }));
}

function periodWindow(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { days, from: from.toISOString(), to: to.toISOString() };
}

export async function analyzePriceIntelligence({ lat, lng, radiusKm, categorySlug, days = 90 }) {
  const category = await getActiveBusinessCategoryBySlug(categorySlug);
  if (!category) throw httpError(400, "Unknown or inactive business category.");

  const location = { latitude: lat, longitude: lng };
  const mappedCategoryIds = await getMappedProductCategoryIds(category.id);

  if (mappedCategoryIds.length === 0) {
    return {
      location,
      radiusKm,
      category: { slug: category.slug, name: category.name },
      analysisStatus: "category-mapping-unavailable",
    };
  }

  const listings = await loadEligibleListings({ lat, lng, radiusKm, mappedCategoryIds });
  const allVariants = groupByVariant(listings);

  const totalListingsAnalyzed = listings.length;
  const dataSufficiency =
    totalListingsAnalyzed === 0
      ? "no-price-data"
      : totalListingsAnalyzed <= LIMITED_DATA_MAX_OBSERVATIONS
        ? "limited-price-data"
        : "available";

  // Ranked primarily by store/listing observations -- the most locally
  // representative variants first -- per this milestone's own preference.
  const shortlist = [...allVariants].sort((a, b) => b.observations - a.observations).slice(0, SHORTLIST_LIMIT);

  const period = periodWindow(days);
  const productsWithSearches = await attachObservedSearches(shortlist, { lat, lng, radiusKm, period });

  return {
    location,
    radiusKm,
    category: { slug: category.slug, name: category.name },
    analysisStatus: "ok",
    dataSufficiency,
    summary: {
      productsWithObservations: allVariants.length,
      listingsAnalyzed: totalListingsAnalyzed,
      storesRepresented: new Set(listings.map((l) => l.store_id)).size,
    },
    products: productsWithSearches,
  };
}
