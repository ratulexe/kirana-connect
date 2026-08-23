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
  getProducts,
  getSellers,
  getStore,
  getStores,
  patchBrand,
  patchCategory,
  patchProduct,
  patchStore,
  postApproveStore,
  postApproveStoreChange,
  postBrand,
  postCategory,
  postProductImage,
  postProduct,
  postRejectStore,
  postRejectStoreChange,
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

router.get("/sellers", asyncHandler(getSellers));

router.get("/products", asyncHandler(getProducts));
router.post(
  "/product-images",
  express.raw({ type: "*/*", limit: "2mb" }),
  asyncHandler(postProductImage),
);
router.post("/products", asyncHandler(postProduct));
router.get("/products/:productId", asyncHandler(getProduct));
router.patch("/products/:productId", asyncHandler(patchProduct));

router.get("/categories", asyncHandler(getCategories));
router.post("/categories", asyncHandler(postCategory));
router.patch("/categories/:categoryId", asyncHandler(patchCategory));

router.get("/brands", asyncHandler(getBrands));
router.post("/brands", asyncHandler(postBrand));
router.patch("/brands/:brandId", asyncHandler(patchBrand));

export default router;
