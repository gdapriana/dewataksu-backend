import express from "express";
import UserController from "../controllers/user.controller";
import { DestinationController } from "../controllers/destination.controller";
import { CategoryController } from "../controllers/category.controller";

const publicRoute = express.Router();

// USER
publicRoute.post("/api/register", UserController.REGISTER);
publicRoute.post("/api/login", UserController.LOGIN);
publicRoute.get("/api/token", UserController.REFRESH_TOKEN);
publicRoute.delete("/api/logout", UserController.LOGOUT);

// DESTINATION
publicRoute.get("/api/destinations/:slug", DestinationController.GET);
publicRoute.get("/api/destinations", DestinationController.GETS);

// CATEGORY
publicRoute.get("/api/categories/:id", CategoryController.GET);
publicRoute.get("/api/categories", CategoryController.GETS);

export default publicRoute;
