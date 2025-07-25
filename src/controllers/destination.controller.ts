import { NextFunction, Request, Response } from "express";
import DestinationService from "../services/destination.service";

class DestinationController {
  static async GET(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const data = await DestinationService.GET(slug);
      res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  }
}

export default DestinationController;
