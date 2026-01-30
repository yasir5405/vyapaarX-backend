import { Router } from "express";
import {
  getUserDetails,
  loginUser,
  logout,
  refreshToken,
  registerUser,
  resetPassword,
  resetPasswordLink,
} from "../controllers/auth.controller";
import { verifyJwt } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/register", registerUser); //done
authRouter.post("/login", loginUser); //done
authRouter.get("/me", verifyJwt, getUserDetails); //done
authRouter.get("/refresh-token", refreshToken); //done
authRouter.get("/logout", logout); //done
authRouter.post("/forgot-password", resetPasswordLink);
authRouter.post("/reset-password", resetPassword);

export { authRouter };
