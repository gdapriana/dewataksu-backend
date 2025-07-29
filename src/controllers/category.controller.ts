import { NextFunction, Request, Response } from "express";
import { CategoryService } from "../services/category.service";

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
}
