import express from "express";
import UserController from "../controllers/user.controller";
import DestinationController from "../controllers/destination.controller";

const publicRoute = express.Router();

// USER
publicRoute.post("/api/register", UserController.REGISTER);
publicRoute.post("/api/login", UserController.LOGIN);
publicRoute.get("/api/token", UserController.REFRESH_TOKEN);
publicRoute.delete("/api/logout", UserController.LOGOUT);

// DESTINATION
publicRoute.get("/api/destinations/:slug", DestinationController.GET);

export default publicRoute;
