import express from "express";
import adminMiddleware from "../middleware/admin.middleware";
import { DestinationController, DestinationGalleryController } from "../controllers/destination.controller";

const adminRoute = express.Router();
adminRoute.use(adminMiddleware);

// destinations
adminRoute.post("/api/destinations", DestinationController.POST);
adminRoute.patch("/api/destinations/:id", DestinationController.PATCH);
adminRoute.delete("/api/destinations/:id", DestinationController.DELETE);
adminRoute.post("/api/destinations/:id/gallery", DestinationGalleryController.POST);
adminRoute.delete("/api/destinations/:id/gallery", DestinationGalleryController.DELETE);

export default adminRoute;
