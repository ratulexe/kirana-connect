import {
  listCategories,
  listBrands,
  listProducts,
  listProductsByIds,
  getProductBySlug,
} from "../services/catalogue.service.js";
import { listMomentImages } from "../services/homepageMoments.service.js";
import { optionalBoolean, optionalString, parseLocation, parsePagination } from "../utils/queryParams.js";
import { uuidField } from "../utils/validateInventory.js";
import { badRequest } from "../utils/httpError.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LOOKUP_IDS = 50;

export async function getCategories(req, res) {
  const data = await listCategories();
  res.status(200).json({ success: true, data });
}

export async function getBrands(req, res) {
  const data = await listBrands();
  res.status(200).json({ success: true, data });
}

export async function getHomepageMoments(req, res) {
  const data = await listMomentImages();
  res.status(200).json({ success: true, data });
}

export async function getProducts(req, res) {
  const { limit, offset } = parsePagination(req.query);

  const { products, total, nearbyStoreCount } = await listProducts({
    search: optionalString(req.query.q, { field: "q" }),
    categorySlug: optionalString(req.query.category, { field: "category" }),
    brandSlug: optionalString(req.query.brand, { field: "brand" }),
    storeId: req.query.store_id ? uuidField(req.query.store_id, "store_id") : null,
    availableOnly: optionalBoolean(req.query.available_only, { field: "available_only" }),
    location: parseLocation(req.query, { required: false }),
    limit,
    offset,
  });

  res.status(200).json({
    success: true,
    data: products,
    meta: { total, limit, offset, returned: products.length, nearby_store_count: nearbyStoreCount },
  });
}

/** Bulk product lookup by id, for client-side collections like the wishlist. */
export async function getProductsByIds(req, res) {
  const raw = optionalString(req.query.ids, { field: "ids", maxLength: 2000 });
  const ids = raw ? [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))] : [];

  if (ids.length > MAX_LOOKUP_IDS) {
    throw badRequest(`ids must contain at most ${MAX_LOOKUP_IDS} values.`);
  }

  const validIds = ids.filter((id) => UUID.test(id));
  const data = await listProductsByIds(validIds);

  res.status(200).json({ success: true, data });
}

export async function getProduct(req, res) {
  const data = await getProductBySlug(req.params.slug);
  res.status(200).json({ success: true, data });
}
