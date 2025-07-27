import express from "express";
import adminMiddleware from "../middleware/admin.middleware";
import DestinationController from "../controllers/destination.controller";

const adminRoute = express.Router();
adminRoute.use(adminMiddleware);

// destinations
adminRoute.post("/api/destinations", DestinationController.POST);

export default adminRoute;
