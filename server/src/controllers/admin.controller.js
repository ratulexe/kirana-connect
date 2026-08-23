import {
  approveStore,
  approveStoreChange,
  createBrand,
  createCategory,
  createProduct,
  dashboardMetrics,
  getAdminProduct,
  getAdminProfile,
  getStoreDetail,
  listAdminBrands,
  listAdminCategories,
  listAdminProducts,
  listPendingStores,
  listPendingStoreChanges,
  listSellers,
  listStores,
  rejectStore,
  rejectStoreChange,
  updateBrand,
  updateCategory,
  updateProduct,
  updateStoreState,
  uploadProductImage,
} from "../services/admin.service.js";
import {
  validateAdminStorePatch,
  validateBrandCreate,
  validateBrandUpdate,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateProductCreate,
  validateProductUpdate,
} from "../utils/adminValidation.js";
import { badRequest } from "../utils/httpError.js";
import { optionalString, parsePagination } from "../utils/queryParams.js";
import { uuidField } from "../utils/validateInventory.js";

function optionalBooleanQuery(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  throw badRequest(`${field} must be true or false.`);
}

export async function getMe(req, res) {
  const data = await getAdminProfile(req.user);
  res.status(200).json({ success: true, data });
}

export async function getDashboard(req, res) {
  const data = await dashboardMetrics();
  res.status(200).json({ success: true, data });
}

export async function getPendingStores(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const { stores, total } = await listPendingStores({ limit, offset });
  res.status(200).json({
    success: true,
    data: stores,
    meta: { total, limit, offset, returned: stores.length },
  });
}

export async function getPendingStoreChanges(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const { changes, total } = await listPendingStoreChanges({ limit, offset });
  res.status(200).json({
    success: true,
    data: changes,
    meta: { total, limit, offset, returned: changes.length },
  });
}

export async function getStores(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const { stores, total } = await listStores({
    search: optionalString(req.query.q, { field: "q" }),
    verified: optionalBooleanQuery(req.query.verified, "verified"),
    active: optionalBooleanQuery(req.query.active, "active"),
    limit,
    offset,
  });

  res.status(200).json({
    success: true,
    data: stores,
    meta: { total, limit, offset, returned: stores.length },
  });
}

export async function getStore(req, res) {
  const data = await getStoreDetail(uuidField(req.params.storeId, "Store"));
  res.status(200).json({ success: true, data });
}

export async function postApproveStore(req, res) {
  const data = await approveStore(uuidField(req.params.storeId, "Store"));
  res.status(200).json({ success: true, data });
}

export async function postRejectStore(req, res) {
  const data = await rejectStore(uuidField(req.params.storeId, "Store"));
  res.status(200).json({ success: true, data });
}

export async function postApproveStoreChange(req, res) {
  const data = await approveStoreChange(
    uuidField(req.params.changeId, "Store change"),
    req.user.id,
  );
  res.status(200).json({ success: true, data });
}

export async function postRejectStoreChange(req, res) {
  const data = await rejectStoreChange(
    uuidField(req.params.changeId, "Store change"),
    req.user.id,
  );
  res.status(200).json({ success: true, data });
}

export async function patchStore(req, res) {
  const data = await updateStoreState(
    uuidField(req.params.storeId, "Store"),
    validateAdminStorePatch(req.body),
  );
  res.status(200).json({ success: true, data });
}

export async function getSellers(req, res) {
  const data = await listSellers();
  res.status(200).json({ success: true, data });
}

export async function getProducts(req, res) {
  const { limit, offset } = parsePagination(req.query);
  const { products, total } = await listAdminProducts({
    search: optionalString(req.query.q, { field: "q" }),
    categoryId: req.query.category_id
      ? uuidField(req.query.category_id, "category_id")
      : null,
    brandId: req.query.brand_id ? uuidField(req.query.brand_id, "brand_id") : null,
    active: optionalBooleanQuery(req.query.active, "active"),
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
  const data = await getAdminProduct(uuidField(req.params.productId, "Product"));
  res.status(200).json({ success: true, data });
}

export async function postProduct(req, res) {
  const data = await createProduct(validateProductCreate(req.body));
  res.status(201).json({ success: true, data });
}

export async function patchProduct(req, res) {
  const data = await updateProduct(
    uuidField(req.params.productId, "Product"),
    validateProductUpdate(req.body),
  );
  res.status(200).json({ success: true, data });
}

export async function postProductImage(req, res) {
  const data = await uploadProductImage({
    buffer: req.body,
    mimeType: req.get("content-type")?.split(";")[0]?.trim().toLowerCase(),
  });
  res.status(201).json({ success: true, data });
}

export async function getCategories(req, res) {
  const data = await listAdminCategories();
  res.status(200).json({ success: true, data });
}

export async function postCategory(req, res) {
  const data = await createCategory(validateCategoryCreate(req.body));
  res.status(201).json({ success: true, data });
}

export async function patchCategory(req, res) {
  const data = await updateCategory(
    uuidField(req.params.categoryId, "Category"),
    validateCategoryUpdate(req.body),
  );
  res.status(200).json({ success: true, data });
}

export async function getBrands(req, res) {
  const data = await listAdminBrands();
  res.status(200).json({ success: true, data });
}

export async function postBrand(req, res) {
  const data = await createBrand(validateBrandCreate(req.body));
  res.status(201).json({ success: true, data });
}

export async function patchBrand(req, res) {
  const data = await updateBrand(
    uuidField(req.params.brandId, "Brand"),
    validateBrandUpdate(req.body),
  );
  res.status(200).json({ success: true, data });
}
