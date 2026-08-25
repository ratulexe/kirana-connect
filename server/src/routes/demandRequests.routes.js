import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { postDemandRequest, getStoreDemandHandler } from "../controllers/demandRequests.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// requireAuth is attached per-route, not via router.use(): this router is
// mounted at "/" alongside the public catalogue and discovery routes, and a
// path-less router.use() would run for every request that reaches this
// router regardless of which route actually matches -- including public ones
// like GET /products/:slug -- turning the whole API authenticated by accident.
router.post("/demand-requests", requireAuth, asyncHandler(postDemandRequest));
router.get("/store-demand", requireAuth, asyncHandler(getStoreDemandHandler));

export default router;
