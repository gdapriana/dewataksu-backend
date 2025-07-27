import { NextFunction, Request, Response } from "express";
import DestinationService from "../services/destination.service";
import DestinationValidation from "../validation/destination.validation";
import z from "zod";
import { UserRequest } from "../utils/types";

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
  static async POST(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof DestinationValidation.POST> = req.body;
      const result = await DestinationService.POST(body, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }
}

export default DestinationController;
