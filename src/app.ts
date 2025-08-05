import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorMiddleware from "../src/middleware/error.middleware";
import publicRoute from "./routes/public.route";
import { ResponseError } from "./utils/error-response";
import userRoute from "./routes/user.route";
import adminRoute from "./routes/admin.route";
import cloudinaryRoute from "./routes/cloudinary.route";

const app: Application = express();
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: [process.env.FRONTEND_DEV_URL!, process.env.FRONTEND_PROD_URL!, process.env.FRONTEND_PROD_ADMIN_URL!],
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ data: "ok" });
});

app.use(publicRoute);
app.use(userRoute);
app.use(cloudinaryRoute);
app.use(adminRoute);

app.use((req, res, next) => {
  const error = new ResponseError({
    status: 500,
    message: "routing not found",
  });
  next(error);
});

app.use(errorMiddleware);

export default app;
