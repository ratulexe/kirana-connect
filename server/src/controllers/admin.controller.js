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
  productCatalogueSummary,
  rejectStore,
  rejectStoreChange,
  updateBrand,
  updateCategory,
  updateProduct,
  updateStoreState,
  uploadProductImage,
  resolveProductImageInput,
  setStoreBusinessCategoriesAsAdmin,
} from "../services/admin.service.js";
import {
  listAllBusinessCategories,
  createBusinessCategory,
  updateBusinessCategory,
  listProductCategoryMappings,
  replaceProductCategoryMappings,
} from "../services/businessCategories.service.js";
import { listMomentImages, setMomentImage } from "../services/homepageMoments.service.js";
import {
  validateAdminStorePatch,
  validateBrandCreate,
  validateBrandUpdate,
  validateBusinessCategoryCreate,
  validateBusinessCategoryUpdate,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateProductCreate,
  validateProductUpdate,
} from "../utils/adminValidation.js";
import {
  validateStoreBusinessCategoriesUpdate,
  validateProductCategoryMappingUpdate,
} from "../utils/validateBusinessCategories.js";
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

export async function getProductSummary(req, res) {
  const data = await productCatalogueSummary();
  res.status(200).json({ success: true, data });
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
  const productId = uuidField(req.params.productId, "Product");
  const data = await updateProduct(
    productId,
    validateProductUpdate(req.body, { productId }),
  );
  res.status(200).json({ success: true, data });
}

export async function deleteProductHandler(req, res) {
  const { deleteProduct } = await import("../services/admin.service.js");
  const data = await deleteProduct(uuidField(req.params.productId, "Product"));
  res.status(200).json({ success: true, data });
}

export async function postProductImage(req, res) {
  const data = await uploadProductImage({
    buffer: req.body,
    mimeType: req.get("content-type")?.split(";")[0]?.trim().toLowerCase(),
  });
  res.status(201).json({ success: true, data });
}

export async function postResolveProductImage(req, res) {
  const imageUrl = typeof req.body?.image_url === "string" ? req.body.image_url.trim() : "";
  if (!imageUrl) throw badRequest("image_url is required.");
  const data = await resolveProductImageInput(imageUrl);
  res.status(200).json({ success: true, data });
}

export async function getCategories(req, res) {
  const data = await listAdminCategories();
  res.status(200).json({ success: true, data });
}

export async function getHomepageMoments(req, res) {
  const data = await listMomentImages();
  res.status(200).json({ success: true, data });
}

export async function putHomepageMoment(req, res) {
  const imageUrl = typeof req.body?.image_url === "string" ? req.body.image_url.trim() : "";
  const data = await setMomentImage(req.params.slug, imageUrl || null);
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

export async function getBusinessCategories(req, res) {
  const data = await listAllBusinessCategories();
  res.status(200).json({ success: true, data });
}

export async function postBusinessCategory(req, res) {
  const data = await createBusinessCategory(validateBusinessCategoryCreate(req.body));
  res.status(201).json({ success: true, data });
}

export async function patchBusinessCategory(req, res) {
  const data = await updateBusinessCategory(
    uuidField(req.params.categoryId, "Business category"),
    validateBusinessCategoryUpdate(req.body),
  );
  res.status(200).json({ success: true, data });
}

export async function getProductCategoryMappings(req, res) {
  const data = await listProductCategoryMappings(uuidField(req.params.categoryId, "Business category"));
  res.status(200).json({ success: true, data });
}

export async function putProductCategoryMappings(req, res) {
  const productCategoryIds = validateProductCategoryMappingUpdate(req.body);
  const data = await replaceProductCategoryMappings(
    uuidField(req.params.categoryId, "Business category"),
    productCategoryIds,
  );
  res.status(200).json({ success: true, data });
}

export async function putStoreBusinessCategoriesAdmin(req, res) {
  const { categoryIds, primaryCategoryId } = validateStoreBusinessCategoriesUpdate(req.body);
  const data = await setStoreBusinessCategoriesAsAdmin({
    storeId: uuidField(req.params.storeId, "Store"),
    categoryIds,
    primaryCategoryId,
  });
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

export async function deleteBrandHandler(req, res) {
  const { deleteBrand } = await import("../services/admin.service.js");
  const data = await deleteBrand(uuidField(req.params.brandId, "Brand"));
  res.status(200).json({ success: true, data });
}

export async function getProductMedia(req, res) {
  const { listProductMedia } = await import("../services/admin.service.js");
  const data = await listProductMedia(uuidField(req.params.productId, "Product"));
  res.status(200).json({ success: true, data });
}

export async function postProductMedia(req, res) {
  const { createProductMedia } = await import("../services/admin.service.js");
  const productId = uuidField(req.params.productId, "Product");
  const uploaded = await uploadProductImage({
    buffer: req.body,
    mimeType: req.get("content-type")?.split(";")[0]?.trim().toLowerCase(),
  });

  const mediaType = req.get("x-media-type") || "front";
  const altText = req.get("x-alt-text") || null;
  const sortOrder = Number(req.get("x-sort-order") || 0);
  const isPrimary = req.get("x-is-primary") === "true";

  const validTypes = ["front", "back", "nutrition", "promotional"];
  if (!validTypes.includes(mediaType)) {
    const { httpError } = await import("../utils/httpError.js");
    throw httpError(400, `Invalid media type. Must be one of: ${validTypes.join(", ")}`);
  }

  const data = await createProductMedia(productId, {
    mediaType,
    imageUrl: uploaded.public_url,
    storagePath: uploaded.path,
    altText,
    sortOrder,
    isPrimary,
  });

  res.status(201).json({ success: true, data });
}

export async function patchProductMedia(req, res) {
  const { updateProductMedia } = await import("../services/admin.service.js");
  const mediaId = uuidField(req.params.mediaId, "Media");
  const body = req.body ?? {};
  const patch = {};

  if (body.alt_text !== undefined) patch.alt_text = typeof body.alt_text === "string" ? body.alt_text.trim() || null : null;
  if (body.sort_order !== undefined) {
    const order = Number(body.sort_order);
    if (!Number.isInteger(order) || order < 0 || order > 999) {
      const { httpError } = await import("../utils/httpError.js");
      throw httpError(400, "sort_order must be an integer between 0 and 999.");
    }
    patch.sort_order = order;
  }
  if (body.is_primary !== undefined) patch.is_primary = Boolean(body.is_primary);

  if (Object.keys(patch).length === 0) {
    const { httpError } = await import("../utils/httpError.js");
    throw httpError(400, "No valid fields to update.");
  }

  const data = await updateProductMedia(mediaId, patch);
  res.status(200).json({ success: true, data });
}

export async function deleteProductMediaHandler(req, res) {
  const { deleteProductMedia } = await import("../services/admin.service.js");
  const data = await deleteProductMedia(uuidField(req.params.mediaId, "Media"));
  res.status(200).json({ success: true, data });
}
