import express from "express";
import adminMiddleware from "../middleware/admin.middleware";
import { DestinationController, DestinationGalleryController } from "../controllers/destination.controller";
import { CategoryController } from "../controllers/category.controller";
import { TraditionController, TraditionGalleryController } from "../controllers/tradition.controller";
import { AdminController } from "../controllers/user.controller";

const adminRoute = express.Router();
adminRoute.use(adminMiddleware);

// user
adminRoute.get("/api/users/:username", AdminController.GET);
adminRoute.get("/api/users", AdminController.GETS);
adminRoute.delete("/api/users/:username", AdminController.DELETE);

// destination
adminRoute.post("/api/destinations", DestinationController.POST);
adminRoute.patch("/api/destinations/:id", DestinationController.PATCH);
adminRoute.delete("/api/destinations/:id", DestinationController.DELETE);
adminRoute.post("/api/destinations/:id/gallery", DestinationGalleryController.POST);
adminRoute.delete("/api/destinations/:id/gallery", DestinationGalleryController.DELETE);

// tradition
adminRoute.post("/api/traditions", TraditionController.POST);
adminRoute.patch("/api/traditions/:id", TraditionController.PATCH);
adminRoute.delete("/api/traditions/:id", TraditionController.DELETE);
adminRoute.post("/api/traditions/:id/gallery", TraditionGalleryController.POST);
adminRoute.delete("/api/traditions/:id/gallery", TraditionGalleryController.DELETE);

// category
adminRoute.post("/api/categories", CategoryController.POST);
adminRoute.patch("/api/categories/:id", CategoryController.PATCH);
adminRoute.delete("/api/categories/:id", CategoryController.DELETE);

export default adminRoute;
