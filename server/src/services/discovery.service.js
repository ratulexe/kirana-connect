import { getPublicClient } from "../config/supabase.js";
import { notFoundError, httpError } from "../utils/httpError.js";
import { boundingBox, haversineKm, roundKm } from "../utils/geo.js";
import { getProductBySlug } from "./catalogue.service.js";

// The nearby search runs in two stages, which is what lets the project avoid a
// PostGIS dependency:
//   1. the database narrows candidates with a latitude/longitude bounding box,
//      served by the partial index on active + verified stores,
//   2. this module computes true great-circle distances over that small set and
//      discards the corners of the box that fall outside the radius.

const STORE_FIELDS = `
  id, name, slug, description, phone,
  address_line_1, address_line_2, locality, city, state, postal_code,
  latitude, longitude
`;

function failed(operation, error) {
  return httpError(502, `Supabase ${operation} failed: ${error.message}`);
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
 * Attaches distance_km and drops anything outside the true radius.
 * Stores without coordinates are dropped when a location was supplied, since
 * their proximity is unknowable.
 */
function withDistance(rows, location, readStore = (row) => row) {
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

      return distance > location.radiusKm ? null : { ...row, distance_km: roundKm(distance) };
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

  const stores = withDistance(data, location);

  if (location) {
    stores.sort((a, b) => a.distance_km - b.distance_km);
  }

  return {
    stores: stores.slice(offset, offset + limit),
    total: stores.length,
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

  const { data: hours, error: hoursError } = await client
    .from("store_hours")
    .select("day_of_week, opens_at, closes_at, is_closed")
    .eq("store_id", store.id)
    .order("day_of_week", { ascending: true });

  if (hoursError) throw failed("store hours lookup", hoursError);

  return { ...store, hours };
}

/**
 * The price-comparison read path: every nearby store currently stocking one
 * canonical product, with that store's own price.
 */
export async function findStoresStockingProduct({ slug, location, sort, limit }) {
  const product = await getProductBySlug(slug);

  let query = getPublicClient()
    .from("store_products")
    .select(
      `
        id, selling_price, discount_percentage, stock_status,
        quantity_available, last_stock_update,
        store:stores!inner (${STORE_FIELDS})
      `,
    )
    .eq("product_id", product.id)
    .eq("is_available", true);

  if (location) {
    query = applyBoundingBox(query, "store.", location);
  }

  const { data, error } = await query;
  if (error) throw failed("store product lookup", error);

  const mrp = Number(product.mrp);

  const offers = withDistance(data, location, (row) => row.store).map((row) => {
    const sellingPrice = Number(row.selling_price);
    const savings = mrp - sellingPrice;

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
      last_stock_update: row.last_stock_update,
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
    product,
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
