import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getStatus, submitStore } from "../controllers/storeOnboarding.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// Every route here is store-owner private: authentication first, always.
router.use(requireAuth);

router.get("/status", asyncHandler(getStatus));
router.post("/", asyncHandler(submitStore));

export default router;
