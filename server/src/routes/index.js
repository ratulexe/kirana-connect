import { Router } from "express";
import healthRoutes from "./health.routes.js";
import catalogueRoutes from "./catalogue.routes.js";
import discoveryRoutes from "./discovery.routes.js";
import storeOnboardingRoutes from "./storeOnboarding.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import adminRoutes from "./admin.routes.js";
import demandRequestsRoutes from "./demandRequests.routes.js";
import searchEventsRoutes from "./searchEvents.routes.js";
import businessCategoriesRoutes from "./businessCategories.routes.js";
import entrepreneurRoutes from "./entrepreneur.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/store-onboarding", storeOnboardingRoutes);
router.use("/store-inventory", inventoryRoutes);
router.use("/admin", adminRoutes);
router.use("/", demandRequestsRoutes);
router.use("/", searchEventsRoutes);
router.use("/", businessCategoriesRoutes);
router.use("/", entrepreneurRoutes);
router.use("/", catalogueRoutes);
router.use("/", discoveryRoutes);

export default router;
