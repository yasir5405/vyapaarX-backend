import { Router } from "express";
import {
  getUserDetails,
  loginUser,
  logout,
  refreshToken,
  registerUser,
} from "../controllers/auth.controller";
import { verifyJwt } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/refresh-token", refreshToken);
authRouter.get("/me", verifyJwt, getUserDetails);
authRouter.get("/logout", logout);

export { authRouter };
