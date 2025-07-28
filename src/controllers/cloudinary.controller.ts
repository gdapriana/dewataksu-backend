import { Request, Response, NextFunction } from "express";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { cloudinary } from "../utils/cloudinary";

class CloudinaryController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new ResponseError(ErrorResponseMessage.BAD_REQUEST("no file provided"));
      const file = req.file as Express.Multer.File & {
        path: string;
        filename: string;
      };
      res.status(200).json({
        result: {
          url: file.path,
          publicId: file.filename,
        },
      });
    } catch (e) {
      next(e);
    }
  }
  static async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const { public_id } = req.params;
      const result = await cloudinary.uploader.destroy(public_id);
      res.status(200).json({ result });
    } catch (e) {
      next(e);
    }
  }

  static async bulkUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new Error("No files uploaded");
      }
      const result = files.map((file) => ({
        imageUrl: file.path,
        publicId: file.filename,
      }));
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default CloudinaryController;
