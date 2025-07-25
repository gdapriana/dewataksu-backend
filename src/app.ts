import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorMiddleware from "../src/middleware/error.middleware";
import publicRoute from "./routes/public.route";
import { ResponseError } from "./utils/error-response";
import userRoute from "./routes/user.route";

const app: Application = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: "*",
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ data: "ok" });
});

app.use(publicRoute);
app.use(userRoute);

app.use((req, res, next) => {
  const error = new ResponseError({
    status: 500,
    message: "routing not found",
  });
  next(error);
});

app.use(errorMiddleware);

export default app;
