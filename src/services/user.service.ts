import db from "../database/db";
import { ErrorResponseMessage, ResponseError } from "../utils/error-response";
import {
  generateAccessToken,
  generateRefreshToken,
  generateNewAccessToken,
} from "../utils/generate-token";
import {
  LoginRequest,
  RegisterRequest,
  UserPayload,
  UserType,
} from "../utils/types";
import UserValidation from "../validation/user.validation";
import Validation from "../validation/validation";
import bcrypt from "bcrypt";

class UserService {
  static async REGISTER(body: RegisterRequest) {
    const validatedBody: RegisterRequest = Validation.validate(
      UserValidation.REGISTER,
      body,
    );
    const userCheck = await db.user.findUnique({
      where: { username: validatedBody.username },
      select: { username: true },
    });
    if (userCheck)
      throw new ResponseError(ErrorResponseMessage.ALREADY_EXISTS("user"));
    if (validatedBody.password)
      validatedBody.password = await bcrypt.hash(validatedBody.password, 10);
    const user = await db.user.create({
      data: {
        username: validatedBody.username,
        name: validatedBody.name,
        password: validatedBody.password,
      },
      select: {
        username: true,
      },
    });
    return user;
  }

  static async LOGIN(body: LoginRequest) {
    const validatedBody: LoginRequest = Validation.validate(
      UserValidation.LOGIN,
      body,
    );
    const userCheck = await db.user.findUnique({
      where: { username: validatedBody.username },
      select: { username: true, password: true, id: true, role: true },
    });
    if (!userCheck)
      throw new ResponseError(ErrorResponseMessage.INVALID_USERNAME_PASSWORD());
    const isPasswordValid = await bcrypt.compare(
      validatedBody.password,
      userCheck.password!,
    );
    if (!isPasswordValid)
      throw new ResponseError(ErrorResponseMessage.INVALID_USERNAME_PASSWORD());
    const userPayload: UserPayload = {
      id: userCheck.id,
      username: userCheck.username,
      role: userCheck.role,
    };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);
    await db.user.update({
      where: { username: validatedBody.username },
      data: { refreshToken },
    });
    return { refreshToken, accessToken };
  }

  static async REFRESH_TOKEN(refreshToken: string | undefined) {
    if (!refreshToken)
      throw new ResponseError(ErrorResponseMessage.UNAUTHORIZED());
    const userCheck = await db.user.findFirst({ where: { refreshToken } });
    if (!userCheck) throw new ResponseError(ErrorResponseMessage.FORBIDDEN());
    const newAccessToken = await generateNewAccessToken(refreshToken);
    return newAccessToken;
  }

  static async LOGOUT(refreshToken: string | undefined | null) {
    if (!refreshToken)
      throw new ResponseError(ErrorResponseMessage.UNAUTHORIZED());
    const checkUser = await db.user.findFirst({
      where: {
        refreshToken,
      },
      select: {
        refreshToken: true,
        username: true,
      },
    });
    if (!checkUser)
      throw new ResponseError(ErrorResponseMessage.NOT_FOUND("user"));

    const updateUser = await db.user.update({
      where: {
        username: checkUser.username,
      },
      data: {
        refreshToken: null,
      },
      select: {
        username: true,
      },
    });
    return updateUser;
  }

  static async ME(username: string | undefined) {
    const userCheck = await db.user.findUnique({
      where: {
        username,
      },
      include: {
        _count: true,
        stories: true,
        activityLogs: true,
        bookmarks: true,
        comments: true,
        likes: true,
        profileImage: true,
      },
    });
    if (!userCheck)
      throw new ResponseError(ErrorResponseMessage.NOT_FOUND("user"));
    return userCheck;
  }
}

export default UserService;
