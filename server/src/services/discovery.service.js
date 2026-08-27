import { getPublicClient } from "../config/supabase.js";
import { notFoundError, httpError } from "../utils/httpError.js";
import { boundingBox, haversineKm, roundKm } from "../utils/geo.js";
import { getProductBySlug } from "./catalogue.service.js";
import { getExpiryStatus } from "../utils/expiryStatus.js";
import { getActiveReservedQuantities, computeAvailableQuantity } from "../utils/reservationAvailability.js";

// The nearby search runs in two stages, which is what lets the project avoid a
// PostGIS dependency:
//   1. the database narrows candidates with a latitude/longitude bounding box,
//      served by the partial index on active + verified stores,
//   2. this module computes true great-circle distances over that small set and
//      discards the corners of the box that fall outside the radius.

const STORE_FIELDS = `
  id, name, slug, description, phone,
  address_line_1, address_line_2, locality, city, state, postal_code,
  latitude, longitude,
  business_category_links:store_business_categories (
    is_primary,
    business_category:business_categories (id, name, slug)
  )
`;

function failed(operation, error) {
  return httpError(502, `Supabase ${operation} failed: ${error.message}`);
}

/**
 * Reshapes the raw store_business_categories embed into the clean public
 * shape: primary_business_category (or null) and the full business_categories
 * list. A store nobody has classified yet returns null/[] here, never a
 * fabricated default -- that is a valid, permanent "Unclassified" state.
 */
function shapeBusinessCategories(store) {
  if (!store) return store;
  const { business_category_links: links, ...rest } = store;
  const categories = (links ?? []).map((link) => link.business_category).filter(Boolean);
  const primary = (links ?? []).find((link) => link.is_primary)?.business_category ?? null;
  return { ...rest, business_categories: categories, primary_business_category: primary };
}

function applyBoundingBox(query, column, location) {
  const box = boundingBox(location.lat, location.lng, location.radiusKm);
  return query
    .gte(`${column}latitude`, box.minLat)
    .lte(`${column}latitude`, box.maxLat)
    .gte(`${column}longitude`, box.minLng)
    .lte(`${column}longitude`, box.maxLng);
}

/**
 * Attaches distance_km and, by default, drops anything outside the true
 * radius. Stores without coordinates are dropped whenever a location was
 * supplied, since their proximity is unknowable either way.
 *
 * `dropOutOfRadius: false` keeps every row with its real distance attached
 * instead -- used when a caller needs to apply its own keep/drop rule (for
 * example, a specific store that must stay visible regardless of distance).
 */
function withDistance(rows, location, readStore = (row) => row, { dropOutOfRadius = true } = {}) {
  if (!location) {
    return rows.map((row) => ({ ...row, distance_km: null }));
  }

  return rows
    .map((row) => {
      const store = readStore(row);
      if (store?.latitude === null || store?.longitude === null) return null;

      const distance = haversineKm(
        location.lat,
        location.lng,
        Number(store.latitude),
        Number(store.longitude),
      );

      if (dropOutOfRadius && distance > location.radiusKm) return null;
      return { ...row, distance_km: roundKm(distance) };
    })
    .filter(Boolean);
}

export async function findNearbyStores({ location, limit, offset }) {
  let query = getPublicClient().from("stores").select(STORE_FIELDS);

  if (location) {
    query = applyBoundingBox(query, "", location);
  }

  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw failed("nearby store lookup", error);

  const stores = withDistance((data ?? []).map(shapeBusinessCategories), location);

  if (location) {
    stores.sort((a, b) => a.distance_km - b.distance_km);
  }

  return {
    stores: stores.slice(offset, offset + limit),
    total: stores.length,
  };
}

/**
 * Whole-platform counts for the homepage's "by the numbers" section. Every
 * count goes through the public client, so it is exactly what a customer
 * could see for themselves -- unverified stores, inactive products, and
 * unavailable listings are excluded by the same RLS policies that already
 * govern the rest of public discovery, not a second copy of that logic.
 */
export async function getPlatformStats() {
  const client = getPublicClient();

  const [storesResult, productsResult, listingsResult, categoriesResult] = await Promise.all([
    client.from("stores").select("id", { count: "exact", head: true }),
    client.from("products").select("id", { count: "exact", head: true }),
    client.from("store_products").select("id", { count: "exact", head: true }),
    client.from("categories").select("id", { count: "exact", head: true }),
  ]);

  if (storesResult.error) throw failed("load store count", storesResult.error);
  if (productsResult.error) throw failed("load product count", productsResult.error);
  if (listingsResult.error) throw failed("load listing count", listingsResult.error);
  if (categoriesResult.error) throw failed("load category count", categoriesResult.error);

  return {
    stores: storesResult.count ?? 0,
    products: productsResult.count ?? 0,
    listings: listingsResult.count ?? 0,
    categories: categoriesResult.count ?? 0,
  };
}

const DEAL_FIELDS = `
  id, selling_price,
  variant:product_variants!store_products_product_variant_id_fkey (
    id, unit_label, mrp, image_url,
    product:products!inner (id, name, slug, image_url)
  ),
  store:stores!inner (name, slug)
`;

/**
 * Every public listing's real markdown against printed MRP, computed the
 * same way for the single top deal and the full best-offers list so neither
 * can show a number the other would not stand behind. Deliberately not
 * driven by a store's own discount_percentage (a marketing number a seller
 * can set independently of their actual price).
 */
function computeRealOffers(rows) {
  const offers = [];

  for (const row of rows ?? []) {
    const mrp = Number(row.variant?.mrp);
    const sellingPrice = Number(row.selling_price);
    if (!Number.isFinite(mrp) || mrp <= 0 || !Number.isFinite(sellingPrice)) continue;

    const savings = mrp - sellingPrice;
    if (savings <= 0) continue;

    const savingsPercentage = (savings / mrp) * 100;

    offers.push({
      product: {
        id: row.variant.product.id,
        name: row.variant.product.name,
        slug: row.variant.product.slug,
        unit_label: row.variant.unit_label,
        image_url: row.variant.image_url ?? row.variant.product.image_url,
      },
      store: { name: row.store.name, slug: row.store.slug },
      mrp,
      selling_price: sellingPrice,
      savings: Math.round(savings * 100) / 100,
      savings_percentage: Math.round(savingsPercentage * 10) / 10,
    });
  }

  return offers;
}

/**
 * The single best real markdown against printed MRP currently listed
 * anywhere public -- for the homepage's one-deal spotlight.
 */
export async function getTopDeal() {
  const { data, error } = await getPublicClient().from("store_products").select(DEAL_FIELDS);
  if (error) throw failed("load top deal", error);

  const offers = computeRealOffers(data);
  if (!offers.length) return null;

  return offers.reduce((best, offer) => (offer.savings_percentage > best.savings_percentage ? offer : best));
}

/**
 * Every listing with a genuine markdown against MRP, biggest discount first
 * -- for a full "best offers" browse page rather than a single spotlight.
 * A minimum threshold keeps a 2% markdown from cluttering a page whose whole
 * point is showing real deals.
 */
const MIN_BEST_OFFER_PERCENT = 10;

export async function listBestOffers({ limit, offset }) {
  const { data, error } = await getPublicClient().from("store_products").select(DEAL_FIELDS);
  if (error) throw failed("load best offers", error);

  const offers = computeRealOffers(data)
    .filter((offer) => offer.savings_percentage >= MIN_BEST_OFFER_PERCENT)
    .sort((a, b) => b.savings_percentage - a.savings_percentage);

  return {
    offers: offers.slice(offset, offset + limit),
    total: offers.length,
  };
}

export async function getStoreBySlug(slug) {
  const client = getPublicClient();

  const { data: store, error } = await client
    .from("stores")
    .select(STORE_FIELDS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw failed("store lookup", error);
  if (!store) throw notFoundError(`No store found with slug "${slug}"`);

  const shapedStore = shapeBusinessCategories(store);

  const { data: hours, error: hoursError } = await client
    .from("store_hours")
    .select("day_of_week, opens_at, closes_at, is_closed")
    .eq("store_id", store.id)
    .order("day_of_week", { ascending: true });

  if (hoursError) throw failed("store hours lookup", hoursError);

  return { ...shapedStore, hours };
}

/**
 * The price-comparison read path: every nearby store currently stocking one
 * canonical product, with that store's own price.
 */
/**
 * When the caller pins an exact size, that size wins outright. Otherwise, if
 * a location was given and this product has more than one size, prefer
 * whichever size actually has a nearby, available store over always
 * defaulting to the first one -- the catalogue's own "available nearby"
 * badge (see catalogue.service.js's attachNearbyAvailability) is computed
 * per *product*, across every size, so blindly picking the first size here
 * could easily be a size nobody nearby stocks, turning a real "available
 * nearby" into a false "not available nearby" on the product page.
 */
async function pickVariant(product, variantId, location) {
  const variants = [...(product.variants ?? [])].filter((variant) => variant.is_active);
  if (variantId) return variants.find((variant) => variant.id === variantId) ?? null;
  if (variants.length <= 1 || !location) return variants[0] ?? null;

  let query = getPublicClient()
    .from("store_products")
    .select("product_variant_id, store:stores!inner(latitude, longitude)")
    .in("product_variant_id", variants.map((variant) => variant.id))
    .eq("is_available", true);
  query = applyBoundingBox(query, "store.", location);

  const { data, error } = await query;
  if (error) throw failed("nearby size lookup", error);

  const nearbyVariantId = (data ?? []).find(
    (row) =>
      row.store &&
      haversineKm(location.lat, location.lng, Number(row.store.latitude), Number(row.store.longitude)) <=
        location.radiusKm,
  )?.product_variant_id;

  const nearbyVariant = nearbyVariantId && variants.find((variant) => variant.id === nearbyVariantId);
  return nearbyVariant || variants[0] || null;
}

export async function findStoresStockingProduct({ slug, variantId, location, sort, limit, highlightStoreSlug }) {
  const product = await getProductBySlug(slug);
  const variant = await pickVariant(product, variantId, location);
  if (!variant) {
    throw notFoundError(variantId ? "That product size was not found." : "No active size was found for this product.");
  }

  let query = getPublicClient()
    .from("store_products")
    .select(
      `
        id, selling_price, discount_percentage, stock_status,
        quantity_available, last_stock_update, expiry_date,
        store:stores!inner (${STORE_FIELDS})
      `,
    )
    .eq("product_variant_id", variant.id)
    .eq("is_available", true);

  // A specific store a customer was pointed at (a "Find at X" link from a deal
  // or search result) always stays visible, even outside their radius -- the
  // bounding box only narrows the query when there is no such promise to keep.
  if (location && !highlightStoreSlug) {
    query = applyBoundingBox(query, "store.", location);
  }

  const { data, error } = await query;
  if (error) throw failed("store product lookup", error);

  const reservedByStoreProduct = await getActiveReservedQuantities((data ?? []).map((row) => row.id));

  const mrp = Number(variant.mrp);
  const shapedRows = (data ?? []).map((row) => ({ ...row, store: shapeBusinessCategories(row.store) }));

  const offers = withDistance(shapedRows, location, (row) => row.store, { dropOutOfRadius: !highlightStoreSlug })
    .filter((row) => {
      if (!location || !highlightStoreSlug) return true;
      return row.store?.slug === highlightStoreSlug || row.distance_km <= location.radiusKm;
    })
    // Belt-and-suspenders: store_products_select_public RLS already excludes
    // expired rows, but expiry is never trusted twice through only one layer.
    .filter((row) => getExpiryStatus(row.expiry_date).status !== "expired")
    .map((row) => {
      const sellingPrice = Number(row.selling_price);
      const savings = mrp - sellingPrice;
      const { status: expiry_status, days_until_expiry } = getExpiryStatus(row.expiry_date);

      // available_quantity is the number that must drive every reservation
      // decision on this offer: physical stock minus whatever is currently
      // held by an active, unexpired reservation. quantity_available itself
      // is left untouched here (and reservation never writes it) -- it is
      // only ever decremented at collection.
      const activeReserved = reservedByStoreProduct.get(row.id) ?? 0;
      const availableQuantity = computeAvailableQuantity(row.quantity_available, activeReserved);

      return {
        store: row.store,
        distance_km: row.distance_km,
        selling_price: sellingPrice,
        // The store's own advertised offer, distinct from the MRP comparison below.
        discount_percentage: Number(row.discount_percentage),
        // Computed against the printed price, so the customer can see the real gap.
        savings: savings > 0 ? Math.round(savings * 100) / 100 : 0,
        savings_percentage:
          mrp > 0 && savings > 0 ? Math.round((savings / mrp) * 1000) / 10 : 0,
        stock_status: row.stock_status,
        quantity_available: row.quantity_available,
        // Reservation fields: store_product_id is the id the reservation API
        // expects. is_reservable requires an exact tracked quantity (a store
        // that only tracks a coarse stock_status has nothing to hold against)
        // and at least one unit not already actively held by someone else.
        store_product_id: row.id,
        active_reserved_quantity: activeReserved,
        available_quantity: availableQuantity,
        is_reservable: availableQuantity !== null && availableQuantity > 0,
        last_stock_update: row.last_stock_update,
        expiry_date: row.expiry_date,
        expiry_status,
        days_until_expiry,
        is_cheapest: false,
      };
    });

  if (sort === "distance" && location) {
    offers.sort((a, b) => a.distance_km - b.distance_km);
  } else {
    offers.sort((a, b) => a.selling_price - b.selling_price);
  }

  const lowest = offers.reduce(
    (min, offer) => (offer.selling_price < min ? offer.selling_price : min),
    Number.POSITIVE_INFINITY,
  );
  for (const offer of offers) {
    offer.is_cheapest = offer.selling_price === lowest;
  }

  const limited = offers.slice(0, limit);

  return {
    product: {
      ...product,
      selected_variant: variant,
      unit_label: variant.unit_label,
      mrp: variant.mrp,
      barcode: variant.barcode,
      image_url: variant.image_url ?? product.image_url,
    },
    offers: limited,
    summary: {
      store_count: offers.length,
      lowest_price: offers.length ? lowest : null,
      highest_price: offers.length
        ? offers.reduce((max, o) => (o.selling_price > max ? o.selling_price : max), 0)
        : null,
    },
  };
}
