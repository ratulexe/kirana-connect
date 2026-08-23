import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getInventory,
  postInventoryItem,
  patchInventoryItem,
  deleteInventoryItem,
} from "../controllers/inventory.controller.js";
import { asyncHandler } from "../utils/httpError.js";

const router = Router();

// Owner-private throughout.
router.use(requireAuth);

router.get("/", asyncHandler(getInventory));
router.post("/", asyncHandler(postInventoryItem));
router.patch("/:itemId", asyncHandler(patchInventoryItem));
router.delete("/:itemId", asyncHandler(deleteInventoryItem));

export default router;
