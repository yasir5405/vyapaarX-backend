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
authRouter.post("/refresh-token", refreshToken); //done
authRouter.post("/logout", logout); //done
authRouter.post("/forgot-password", resetPasswordLink); //done
authRouter.post("/reset-password", resetPassword); //done

export { authRouter };
