import {
  listCategories,
  listBrands,
  listProducts,
  getProductBySlug,
} from "../services/catalogue.service.js";
import { optionalBoolean, optionalString, parsePagination } from "../utils/queryParams.js";

export async function getCategories(req, res) {
  const data = await listCategories();
  res.status(200).json({ success: true, data });
}

export async function getBrands(req, res) {
  const data = await listBrands();
  res.status(200).json({ success: true, data });
}

export async function getProducts(req, res) {
  const { limit, offset } = parsePagination(req.query);

  const { products, total } = await listProducts({
    search: optionalString(req.query.q, { field: "q" }),
    categorySlug: optionalString(req.query.category, { field: "category" }),
    brandSlug: optionalString(req.query.brand, { field: "brand" }),
    availableOnly: optionalBoolean(req.query.available_only, { field: "available_only" }),
    limit,
    offset,
  });

  res.status(200).json({
    success: true,
    data: products,
    meta: { total, limit, offset, returned: products.length },
  });
}

export async function getProduct(req, res) {
  const data = await getProductBySlug(req.params.slug);
  res.status(200).json({ success: true, data });
}
