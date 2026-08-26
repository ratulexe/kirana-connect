import { Router } from "express";
import {
  getLocationCandidates,
  getLocationSuggestionsHandler,
  getCompetitors,
  getDemandSupply,
  getMarketReach,
  getPriceIntelligence,
} from "../controllers/entrepreneur.controller.js";
import { postAdvisorMessage } from "../controllers/advisor.controller.js";
import { asyncHandler } from "../utils/httpError.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Public and anonymous: the Portal has no login, and none of these reads
// anything private -- location text and aggregate public data only.
router.get("/entrepreneur/location-candidates", asyncHandler(getLocationCandidates));
router.get("/entrepreneur/competitors", asyncHandler(getCompetitors));
router.get("/entrepreneur/demand-supply", asyncHandler(getDemandSupply));
router.get("/entrepreneur/market-reach", asyncHandler(getMarketReach));
router.get("/entrepreneur/price-intelligence", asyncHandler(getPriceIntelligence));

// Keystroke-driven, so a tighter per-IP limit than the advisor: 40 requests
// per minute comfortably covers real typing (debounced client-side to
// roughly 1 request per 300-400ms) while bounding a billed provider's quota
// against a runaway or scripted client.
const locationSuggestRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 40,
  message: "Too many location searches in a short time. Please slow down.",
});
router.get(
  "/entrepreneur/location-suggestions",
  locationSuggestRateLimit,
  asyncHandler(getLocationSuggestionsHandler),
);

// Modest per-IP limit on the one endpoint that calls a billed external AI
// provider -- 12 requests per 5 minutes is generous for a real advisory
// conversation but blocks naive scripted abuse. See middleware/rateLimit.js
// for why this is in-memory rather than a shared store.
const advisorRateLimit = createRateLimiter({
  windowMs: 5 * 60_000,
  max: 12,
  message: "You've sent a lot of questions in a short time. Please wait a few minutes and try again.",
});
router.post("/entrepreneur/advisor", advisorRateLimit, asyncHandler(postAdvisorMessage));

export default router;
