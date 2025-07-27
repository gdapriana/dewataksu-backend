import { Response, NextFunction } from "express";
import { UserRequest } from "../utils/types";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";

const adminMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    next(new ResponseError(ErrorResponseMessage.FORBIDDEN()));
  } else {
    next();
  }
};

export default adminMiddleware;
