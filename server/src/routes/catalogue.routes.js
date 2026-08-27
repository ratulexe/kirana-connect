import { Router } from "express";
import {
  getCategories,
  getBrands,
  getHomepageMoments,
  getProducts,
  getProductsByIds,
  getProduct,
} from "../controllers/catalogue.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

router.get("/categories", asyncHandler(getCategories));
router.get("/brands", asyncHandler(getBrands));
router.get("/homepage-moments", asyncHandler(getHomepageMoments));
router.get("/products", asyncHandler(getProducts));
router.get("/products/by-ids", asyncHandler(getProductsByIds));
router.get("/products/:slug", asyncHandler(getProduct));

export default router;
