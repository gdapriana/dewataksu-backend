import express from "express";
import { upload } from "../utils/cloudinary";
import CloudinaryController from "../controllers/cloudinary.controller";
import adminMiddleware from "../middleware/admin.middleware";

const cloudinaryRoute = express.Router();
cloudinaryRoute.post("/api/upload", upload.single("image") as any, CloudinaryController.upload);
cloudinaryRoute.post("/api/bulk-upload", adminMiddleware, upload.array("images", 10) as any, CloudinaryController.bulkUpload);
cloudinaryRoute.delete("/api/upload/:public_id", CloudinaryController.destroy);
export default cloudinaryRoute;
