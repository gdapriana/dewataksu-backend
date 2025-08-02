import express from "express";
import verifyMiddleware from "../middleware/verify.middleware";
import { UserController } from "../controllers/user.controller";
import { DestinationBookmarkController, DestinationCommentController, DestinationLikeController } from "../controllers/destination.controller";
import { TraditionBookmarkController, TraditionCommentController, TraditionLikeController } from "../controllers/tradition.controller";
import { StoryBookmarkController, StoryCommentController, StoryController, StoryLikeController } from "../controllers/story.controller";

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

// STORY
userRoute.post("/api/stories", StoryController.POST);
userRoute.patch("/api/stories/:id", StoryController.PATCH);
userRoute.delete("/api/stories/:id", StoryController.DELETE);
userRoute.post("/api/stories/:id/comment", StoryCommentController.POST);
userRoute.delete("/api/stories/:destinationId/comments/:commentId", StoryCommentController.DELETE);
userRoute.post("/api/stories/:id/bookmark", StoryBookmarkController.POST);
userRoute.delete("/api/stories/:id/bookmark", StoryBookmarkController.DELETE);
userRoute.post("/api/stories/:id/like", StoryLikeController.POST);
userRoute.delete("/api/stories/:id/like", StoryLikeController.DELETE);

export default userRoute;
