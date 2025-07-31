import { NextFunction, Request, Response } from "express";
import { TraditionService } from "../services/tradition.service";
import z from "zod";
import { TraditionValidation } from "../validation/tradition.validation";
import { UserRequest } from "../utils/types";

export class TraditionController {
  static async GET(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const result = await TraditionService.GET(slug);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async GETS(req: Request, res: Response, next: NextFunction) {
    try {
      const query: z.infer<typeof TraditionValidation.QUERY> | any = req.query;
      const result = await TraditionService.GETS(query);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof TraditionValidation.POST> = req.body;
      const result = await TraditionService.POST(body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async PATCH(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof TraditionValidation.PATCH> = req.body;
      const { id } = req.params;
      const result = await TraditionService.PATCH(id, body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await TraditionService.DELETE(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}
