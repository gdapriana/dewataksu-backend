import express from "express";
import verifyMiddleware from "../middleware/verify.middleware";
import UserController from "../controllers/user.controller";
import { DestinationCommentController } from "../controllers/destination.controller";

const userRoute = express.Router();
userRoute.use(verifyMiddleware);
userRoute.get("/api/me", UserController.ME);

// DESTINATION | COMMENT
userRoute.post("/api/destinations/:id/comment", DestinationCommentController.POST);
userRoute.delete("/api/comments/:id", DestinationCommentController.DELETE);

// DESTINATION | LIKE
// DESTINATION | SAVE

export default userRoute;
