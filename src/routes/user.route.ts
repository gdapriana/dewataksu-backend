import express from "express";
import verifyMiddleware from "../middleware/verify.middleware";
import UserController from "../controllers/user.controller";
import { DestinationBookmarkController, DestinationCommentController, DestinationLikeController } from "../controllers/destination.controller";

const userRoute = express.Router();
userRoute.use(verifyMiddleware);
userRoute.get("/api/me", UserController.ME);

// DESTINATION | COMMENT
userRoute.post("/api/destinations/:id/comment", DestinationCommentController.POST);
userRoute.delete("/api/comments/:id", DestinationCommentController.DELETE);

// DESTINATION | BOOKMARK
userRoute.post("/api/destinations/:id/bookmark", DestinationBookmarkController.POST);
userRoute.delete("/api/destinations/:id/bookmark", DestinationBookmarkController.DELETE);

// DESTINATION | SAVE
userRoute.post("/api/destinations/:id/like", DestinationLikeController.POST);
userRoute.delete("/api/destinations/:id/like", DestinationLikeController.DELETE);

export default userRoute;
