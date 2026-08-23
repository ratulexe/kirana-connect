import {
  findNearbyStores,
  getStoreBySlug,
  findStoresStockingProduct,
} from "../services/discovery.service.js";
import {
  optionalString,
  parseLocation,
  parsePagination,
} from "../utils/queryParams.js";
import { badRequest } from "../utils/httpError.js";

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
    location,
    sort,
    limit,
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
