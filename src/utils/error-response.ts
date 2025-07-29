import { ErrorResponse } from "../utils/types";

type Schema = "user" | "activity" | "gallery" | "image" | "category" | "like" | "tag" | "user" | "destination" | "tradition" | "story" | "comment" | "bookmark" | "comment";

export class ErrorResponseMessage {
  static INVALID_USERNAME_PASSWORD(): ErrorResponse {
    return {
      status: 401,
      message: `wrong username or password`,
    };
  }
  static BAD_REQUEST(reason: string): ErrorResponse {
    return {
      status: 400,
      message: `bad request: ${reason}`,
    };
  }

  static UNAUTHORIZED(message: string = "authentication failed, please login."): ErrorResponse {
    return {
      status: 401,
      message,
    };
  }

  static FORBIDDEN(): ErrorResponse {
    return {
      status: 403,
      message: "you do not have permission to perform this action.",
    };
  }

  static NOT_FOUND(schema: Schema): ErrorResponse {
    return {
      status: 404,
      message: `${schema} not found.`,
    };
  }

  static ALREADY_EXISTS(schema: Schema): ErrorResponse {
    return {
      status: 409,
      message: `${schema} already exists.`,
    };
  }

  static INTERNAL_SERVER_ERROR(): ErrorResponse {
    return {
      status: 500,
      message: "an unexpected error occurred on the server.",
    };
  }

  static ZOD_ERROR(errors: { form: string; message: string }[]) {
    return {
      status: 400,
      message: errors,
    };
  }
}

export class ResponseError extends Error {
  constructor(public data: ErrorResponse) {
    super(data.message);
  }
}
