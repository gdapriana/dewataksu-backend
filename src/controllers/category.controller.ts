import { NextFunction, Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import z from "zod";
import { CategoryValidation } from "../validation/category.validation";
import { UserRequest } from "../utils/types";

export class CategoryController {
  static async GET(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CategoryService.GET(id);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async GETS(req: Request, res: Response, next: NextFunction) {
    try {
      const query: z.infer<typeof CategoryValidation.QUERY> | any = req.query;
      const result = await CategoryService.GETS(query);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof CategoryValidation.POST> = req.body;
      const result = await CategoryService.POST(body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async PATCH(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof CategoryValidation.POST> = req.body;
      const { id } = req.params;
      const result = await CategoryService.PATCH(id, body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CategoryService.DELETE(id, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
}
