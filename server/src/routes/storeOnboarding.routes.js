import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  geocodeStoreAddress,
  getStatus,
  submitStoreChange,
  submitStore,
  putStoreBusinessCategories,
} from "../controllers/storeOnboarding.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// Every route here is store-owner private: authentication first, always.
router.use(requireAuth);

router.get("/geocode", asyncHandler(geocodeStoreAddress));
router.get("/status", asyncHandler(getStatus));
router.post("/", asyncHandler(submitStore));
router.post("/stores/:storeId/changes", asyncHandler(submitStoreChange));
// Immediate effect, unlike /changes above: see updateOwnStoreBusinessCategories.
router.put("/stores/:storeId/business-categories", asyncHandler(putStoreBusinessCategories));

export default router;
