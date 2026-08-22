import { Router } from "express";
import {
  getCategories,
  getBrands,
  getProducts,
  getProduct,
} from "../controllers/catalogue.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

router.get("/categories", asyncHandler(getCategories));
router.get("/brands", asyncHandler(getBrands));
router.get("/products", asyncHandler(getProducts));
router.get("/products/:slug", asyncHandler(getProduct));

export default router;
