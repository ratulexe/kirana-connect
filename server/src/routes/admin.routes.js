import express, { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  getBrands,
  getCategories,
  getDashboard,
  getMe,
  getPendingStores,
  getPendingStoreChanges,
  getProduct,
  getProductSummary,
  getProducts,
  getSellers,
  getStore,
  getStores,
  getBusinessCategories,
  getHomepageMoments,
  putHomepageMoment,
  patchBrand, deleteBrandHandler,
  patchBusinessCategory,
  patchCategory,
  patchProduct,
  patchStore,
  postApproveStore,
  postApproveStoreChange,
  postBrand,
  postBusinessCategory,
  postCategory,
  postProductImage,
  postProduct,
  deleteProductHandler,
  postRejectStore,
  postRejectStoreChange,
  postResolveProductImage,
  putStoreBusinessCategoriesAdmin,
  getProductCategoryMappings,
  putProductCategoryMappings,
} from "../controllers/admin.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/me", asyncHandler(getMe));
router.get("/dashboard", asyncHandler(getDashboard));

router.get("/stores/pending", asyncHandler(getPendingStores));
router.get("/store-changes/pending", asyncHandler(getPendingStoreChanges));
router.get("/stores", asyncHandler(getStores));
router.get("/stores/:storeId", asyncHandler(getStore));
router.patch("/stores/:storeId", asyncHandler(patchStore));
router.post("/stores/:storeId/approve", asyncHandler(postApproveStore));
router.post("/stores/:storeId/reject", asyncHandler(postRejectStore));
router.post("/store-changes/:changeId/approve", asyncHandler(postApproveStoreChange));
router.post("/store-changes/:changeId/reject", asyncHandler(postRejectStoreChange));
router.put("/stores/:storeId/business-categories", asyncHandler(putStoreBusinessCategoriesAdmin));

router.get("/sellers", asyncHandler(getSellers));

router.get("/products/summary", asyncHandler(getProductSummary));
router.get("/products", asyncHandler(getProducts));
router.post(
  "/product-images",
  express.raw({ type: "*/*", limit: "2mb" }),
  asyncHandler(postProductImage),
);
router.post("/product-images/resolve", asyncHandler(postResolveProductImage));
router.post("/products", asyncHandler(postProduct));
router.get("/products/:productId", asyncHandler(getProduct));
router.patch("/products/:productId", asyncHandler(patchProduct));
router.delete("/products/:productId", asyncHandler(deleteProductHandler));

router.get("/categories", asyncHandler(getCategories));
router.post("/categories", asyncHandler(postCategory));
router.patch("/categories/:categoryId", asyncHandler(patchCategory));

router.get("/business-categories", asyncHandler(getBusinessCategories));
router.post("/business-categories", asyncHandler(postBusinessCategory));
router.patch("/business-categories/:categoryId", asyncHandler(patchBusinessCategory));
router.get("/business-categories/:categoryId/product-category-mappings", asyncHandler(getProductCategoryMappings));
router.put("/business-categories/:categoryId/product-category-mappings", asyncHandler(putProductCategoryMappings));

router.get("/homepage-moments", asyncHandler(getHomepageMoments));
router.put("/homepage-moments/:slug", asyncHandler(putHomepageMoment));

router.get("/brands", asyncHandler(getBrands));
router.post("/brands", asyncHandler(postBrand));
router.patch("/brands/:brandId", asyncHandler(patchBrand));
router.delete("/brands/:brandId", asyncHandler(deleteBrandHandler));

router.get("/products/:productId/media", asyncHandler(async (req, res) => {
  const { getProductMedia } = await import("../controllers/admin.controller.js");
  return getProductMedia(req, res);
}));
router.post(
  "/products/:productId/media",
  express.raw({ type: "*/*", limit: "5mb" }),
  asyncHandler(async (req, res) => {
    const { postProductMedia } = await import("../controllers/admin.controller.js");
    return postProductMedia(req, res);
  })
);
router.patch("/media/:mediaId", asyncHandler(async (req, res) => {
  const { patchProductMedia } = await import("../controllers/admin.controller.js");
  return patchProductMedia(req, res);
}));
router.delete("/media/:mediaId", asyncHandler(async (req, res) => {
  const { deleteProductMediaHandler } = await import("../controllers/admin.controller.js");
  return deleteProductMediaHandler(req, res);
}));

export default router;
