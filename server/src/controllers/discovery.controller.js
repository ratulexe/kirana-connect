import {
  findNearbyStores,
  getStoreBySlug,
  findStoresStockingProduct,
  getPlatformStats,
  getTopDeal,
  listBestOffers,
} from "../services/discovery.service.js";
import {
  optionalString,
  parseLocation,
  parsePagination,
} from "../utils/queryParams.js";
import { badRequest } from "../utils/httpError.js";
import { uuidField } from "../utils/validateInventory.js";

export async function getNearbyStores(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const location = parseLocation(req.query, { required: true });

  const { stores, total } = await findNearbyStores({ location, limit, offset });

  res.status(200).json({
    success: true,
    data: stores,
    meta: {
      total,
      limit,
      offset,
      returned: stores.length,
      radius_km: location.radiusKm,
    },
  });
}

export async function getStore(req, res) {
  const data = await getStoreBySlug(req.params.slug);
  res.status(200).json({ success: true, data });
}

export async function getStats(req, res) {
  const data = await getPlatformStats();
  res.status(200).json({ success: true, data });
}

export async function getTopDealHandler(req, res) {
  const data = await getTopDeal();
  res.status(200).json({ success: true, data });
}

export async function getBestOffers(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const { offers, total } = await listBestOffers({ limit, offset });

  res.status(200).json({
    success: true,
    data: offers,
    meta: { total, limit, offset, returned: offers.length },
  });
}

/**
 * The comparison endpoint: which nearby stores stock this product, and at what
 * price. Location is optional so the product page still works before the
 * customer grants location access.
 */
export async function getProductOffers(req, res) {
  const { limit } = parsePagination(req.query);
  const location = parseLocation(req.query, { required: false });

  const sort = optionalString(req.query.sort, { field: "sort" }) ?? "price";
  if (!["price", "distance"].includes(sort)) {
    throw badRequest('sort must be either "price" or "distance"');
  }
  if (sort === "distance" && !location) {
    throw badRequest("sort=distance requires lat and lng");
  }

  const { product, offers, summary } = await findStoresStockingProduct({
    slug: req.params.slug,
    variantId: uuidField(req.query.variant_id, "variant_id", { required: false }),
    location,
    sort,
    limit,
    highlightStoreSlug: optionalString(req.query.store, { field: "store" }),
  });

  res.status(200).json({
    success: true,
    data: { product, offers },
    meta: {
      ...summary,
      sort,
      radius_km: location?.radiusKm ?? null,
      returned: offers.length,
    },
  });
}
