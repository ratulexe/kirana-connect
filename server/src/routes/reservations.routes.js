import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  postReservation,
  getMyReservations,
  postCancelReservation,
  getStoreReservations,
  getStoreReservationByCode,
  postCollectReservation,
} from "../controllers/reservations.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// Consumer: create/list/cancel your own reservations. Mounted at "/" like
// demandRequests.routes.js, so requireAuth is attached per-route rather than
// via router.use(), keeping every other router sharing this mount public.
router.post("/reservations", requireAuth, asyncHandler(postReservation));
router.get("/reservations/mine", requireAuth, asyncHandler(getMyReservations));
router.post("/reservations/:id/cancel", requireAuth, asyncHandler(postCancelReservation));

// Store Portal: reservations against stores the caller owns. Ownership is
// resolved server-side from stores.owner_id on every call (see
// resolveOwnedStore in inventory.service.js) -- store_id is only ever used
// to choose between stores the caller already owns.
router.get("/store-reservations", requireAuth, asyncHandler(getStoreReservations));
router.get("/store-reservations/lookup", requireAuth, asyncHandler(getStoreReservationByCode));
router.post("/store-reservations/:id/collect", requireAuth, asyncHandler(postCollectReservation));

export default router;
