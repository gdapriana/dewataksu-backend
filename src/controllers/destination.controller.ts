import { NextFunction, Request, Response } from "express";
import { DestinationBookmarkService, DestinationCommentService, DestinationService } from "../services/destination.service";
import { DestinationCommentValidation, DestinationValidation } from "../validation/destination.validation";
import z from "zod";
import { UserRequest } from "../utils/types";

export class DestinationController {
  static async GET(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const result = await DestinationService.GET(slug);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }

  static async GETS(req: Request, res: Response, next: NextFunction) {
    try {
      const query: z.infer<typeof DestinationValidation.QUERY> | any = req.query;
      const result = await DestinationService.GETS(query);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof DestinationValidation.POST> = req.body;
      const result = await DestinationService.POST(body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }

  static async PATCH(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const body: z.infer<typeof DestinationValidation.PATCH> = req.body;
      const result = await DestinationService.PATCH(id, body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await DestinationService.DELETE(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
}

export class DestinationCommentController {
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const body: z.infer<typeof DestinationCommentValidation.POST> = req.body;
      const result = await DestinationCommentService.POST(id, body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await DestinationCommentService.DELETE(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
}

export class DestinationBookmarkController {
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await DestinationBookmarkService.POST(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await DestinationBookmarkService.DELETE(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}
