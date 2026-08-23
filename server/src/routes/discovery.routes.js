import { Router } from "express";
import {
  getNearbyStores,
  getStore,
  getProductOffers,
} from "../controllers/discovery.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// Registered before /stores/:slug so "nearby" is not read as a slug.
router.get("/stores/nearby", asyncHandler(getNearbyStores));
router.get("/stores/:slug", asyncHandler(getStore));
router.get("/products/:slug/stores", asyncHandler(getProductOffers));

export default router;
