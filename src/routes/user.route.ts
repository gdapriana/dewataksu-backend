import express from "express";
import verifyMiddleware from "../middleware/verify.middleware";
import UserController from "../controllers/user.controller";
import { DestinationBookmarkController, DestinationCommentController, DestinationLikeController } from "../controllers/destination.controller";
import { TraditionBookmarkController, TraditionCommentController, TraditionLikeController } from "../controllers/tradition.controller";

const userRoute = express.Router();
userRoute.use(verifyMiddleware);
userRoute.get("/api/me", UserController.ME);

// DESTINATION
userRoute.post("/api/destinations/:id/comment", DestinationCommentController.POST);
userRoute.delete("/api/destinations/:destinationId/comments/:commentId", DestinationCommentController.DELETE);
userRoute.post("/api/destinations/:id/bookmark", DestinationBookmarkController.POST);
userRoute.delete("/api/destinations/:id/bookmark", DestinationBookmarkController.DELETE);
userRoute.post("/api/destinations/:id/like", DestinationLikeController.POST);
userRoute.delete("/api/destinations/:id/like", DestinationLikeController.DELETE);

// TRADITION
userRoute.post("/api/traditions/:id/comment", TraditionCommentController.POST);
userRoute.delete("/api/traditions/:traditionId/comments/:commentId", TraditionCommentController.DELETE);
userRoute.post("/api/traditions/:id/bookmark", TraditionBookmarkController.POST);
userRoute.delete("/api/traditions/:id/bookmark", TraditionBookmarkController.DELETE);
userRoute.post("/api/traditions/:id/like", TraditionLikeController.POST);
userRoute.delete("/api/traditions/:id/like", TraditionLikeController.DELETE);

export default userRoute;
