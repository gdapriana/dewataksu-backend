import jwt from "jsonwebtoken";
import { UserPayload } from "./types";
import { ErrorResponseMessage, ResponseError } from "./error-response";

export const generateAccessToken = (user: UserPayload) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "60s" });
};
export const generateRefreshToken = (user: UserPayload) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "1d" });
};

export const generateNewAccessToken = (
  refreshToken: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
      (err, decoded) => {
        if (err) {
          return reject(new ResponseError(ErrorResponseMessage.FORBIDDEN()));
        }
        if (typeof decoded === "object" && decoded !== null) {
          const userPayload: UserPayload = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
          };
          const newAccessToken = generateAccessToken(userPayload);
          resolve(newAccessToken);
        } else {
          reject(
            new ResponseError(
              ErrorResponseMessage.BAD_REQUEST("invalid token payload"),
            ),
          );
        }
      },
    );
  });
};
