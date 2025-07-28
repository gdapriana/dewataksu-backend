import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import { UserPayload, UserRequest } from "../utils/types";

const verifyMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    next(new ResponseError(ErrorResponseMessage.UNAUTHORIZED()));
  } else {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as UserPayload;
      req.user = decoded;
      next();
    } catch (err) {
      console.log(err);
      next(new ResponseError(ErrorResponseMessage.FORBIDDEN()));
    }
  }
};

export default verifyMiddleware;
