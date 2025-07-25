import express from "express";
import UserController from "../controllers/user.controller";

const publicRoute = express.Router();
publicRoute.post("/api/register", UserController.REGISTER);
publicRoute.post("/api/login", UserController.LOGIN);
publicRoute.get("/api/token", UserController.REFRESH_TOKEN);
publicRoute.delete("/api/logout", UserController.LOGOUT);

export default publicRoute;
