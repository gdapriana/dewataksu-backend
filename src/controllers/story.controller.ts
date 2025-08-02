import { NextFunction, Request, Response } from "express";
import z from "zod";
import { UserRequest } from "../utils/types";
import { StoryBookmarkService, StoryCommentService, StoryLikeService, StoryService } from "../services/story.service";
import { StoryCommentValidation, StoryValidation } from "../validation/story.validation";

export class StoryController {
  static async GET(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const result = await StoryService.GET(slug);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }

  static async GETS(req: Request, res: Response, next: NextFunction) {
    try {
      const query: z.infer<typeof StoryValidation.QUERY> | any = req.query;
      const result = await StoryService.GETS(query);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof StoryValidation.POST> = req.body;
      const result = await StoryService.POST(body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }

  static async PATCH(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const body: z.infer<typeof StoryValidation.PATCH> = req.body;
      const result = await StoryService.PATCH(id, body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await StoryService.DELETE(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
}

export class StoryCommentController {
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const body: z.infer<typeof StoryCommentValidation.POST> = req.body;
      const result = await StoryCommentService.POST(id, body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { destinationId, commentId } = req.params;
      const result = await StoryCommentService.DELETE(destinationId, commentId, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
}

export class StoryBookmarkController {
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await StoryBookmarkService.POST(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await StoryBookmarkService.DELETE(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}

export class StoryLikeController {
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await StoryLikeService.POST(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await StoryLikeService.DELETE(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}
