import { Router } from "express";
import healthRoutes from "./health.routes.js";
import catalogueRoutes from "./catalogue.routes.js";
import discoveryRoutes from "./discovery.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/", catalogueRoutes);
router.use("/", discoveryRoutes);

export default router;
