import { Router } from "express";
import {
  getNearbyStores,
  getStore,
  getProductOffers,
  getStats,
  getTopDealHandler,
  getBestOffers,
} from "../controllers/discovery.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

router.get("/stats", asyncHandler(getStats));
router.get("/deals/top", asyncHandler(getTopDealHandler));
router.get("/deals/best", asyncHandler(getBestOffers));
// Registered before /stores/:slug so "nearby" is not read as a slug.
router.get("/stores/nearby", asyncHandler(getNearbyStores));
router.get("/stores/:slug", asyncHandler(getStore));
router.get("/products/:slug/stores", asyncHandler(getProductOffers));

export default router;
