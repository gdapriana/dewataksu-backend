import { NextFunction, Request, Response } from "express";
import DestinationService from "../services/destination.service";
import DestinationValidation from "../validation/destination.validation";
import z from "zod";

class DestinationController {
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
}

export default DestinationController;
