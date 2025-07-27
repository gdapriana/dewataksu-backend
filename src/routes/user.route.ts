import express from "express";
import verifyMiddleware from "../middleware/verify.middleware";
import UserController from "../controllers/user.controller";
import { DestinationCommentController } from "../controllers/destination.controller";

const userRoute = express.Router();
userRoute.use(verifyMiddleware);
userRoute.get("/api/me", UserController.ME);

// destination comment
userRoute.post("/api/destinations/:id/comment", DestinationCommentController.POST);
export default userRoute;
