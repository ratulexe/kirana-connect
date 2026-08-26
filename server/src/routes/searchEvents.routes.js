import { Router } from "express";
import { postSearchEvent } from "../controllers/searchEvents.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// No requireAuth: logging a search must work for anonymous, unauthenticated
// browsing, exactly like the search itself.
router.post("/search-events", asyncHandler(postSearchEvent));

export default router;
