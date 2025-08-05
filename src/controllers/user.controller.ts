import { Request, Response, NextFunction } from "express";
import { UserRequest } from "../utils/types";
import { AdminService, UserService } from "../services/user.service";
import z from "zod";
import UserValidation from "../validation/user.validation";

export class UserController {
  static async REGISTER(req: Request, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof UserValidation.REGISTER> = req.body;
      const data = await UserService.REGISTER(body);
      res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async LOGIN(req: Request, res: Response, next: NextFunction) {
    try {
      const body: z.infer<typeof UserValidation.LOGIN> = req.body;
      const { accessToken, refreshToken } = await UserService.LOGIN(body);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 hari
      });
      res.status(200).json({ data: { accessToken } });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async REFRESH_TOKEN(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const newAccessToken = await UserService.REFRESH_TOKEN(refreshToken);
      res.status(200).json({ data: { newAccessToken } });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async LOGOUT(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const data = await UserService.LOGOUT(refreshToken);
      res.clearCookie("refreshToken");
      res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async ME(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const username = req.user?.username;
      const data = await UserService.ME(username);
      res.status(200).json({ data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}

export class AdminController {
  static async GET(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { username } = req.params;
      const result = await AdminService.GET(username);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async GETS(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.GETS();
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
  static async DELETE(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { username } = req.params;
      const result = await AdminService.DELETE(username, req.user!);
      res.status(200).json({ result });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}
