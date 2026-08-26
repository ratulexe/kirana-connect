import { Router } from "express";
import { getBusinessCategories } from "../controllers/businessCategories.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// Public and anonymous, exactly like /categories and /brands: the active
// taxonomy is not sensitive, and both the Consumer discovery layer and the
// Portal's Entrepreneur form need it without a session.
router.get("/business-categories", asyncHandler(getBusinessCategories));

export default router;
