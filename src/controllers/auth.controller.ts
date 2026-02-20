import { Request, Response } from "express";
import { ApiResponse } from "../schemas/common.response";
import {
  editUserValidationSchema,
  loginValidation,
  registerValidationSchema,
  resetPasswordValidation,
} from "../validations/auth.validation";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import { LoginResponse } from "../schemas/auth.schema";
import crypto from "crypto";
import { sendResetPasswordLink } from "../lib/email";
import { z } from "zod";
import { refreshCookieOptions } from "../lib/cookie";

export const registerUser = async (req: Request, res: Response) => {
  const parsedBody = registerValidationSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Invalid data format.",
      success: false,
      error: { message: parsedBody.error.issues[0].message },
    };

    return res.status(400).json(response);
  }

  const { email, name, password } = parsedBody.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: email,
        name: name,
        password: hashedPassword,
      },
    });

    const response: ApiResponse<null> = {
      message: "Signup successful",
      success: true,
      data: null,
    };
    res.status(201).json(response);
  } catch (error: any) {
    if (error.code === "P2002") {
      const response: ApiResponse<null> = {
        data: null,
        message: "Email already exists",
        success: false,
        error: { message: "Email already exists." },
      };
      return res.status(409).json(response);
    }
    const response: ApiResponse<null> = {
      data: null,
      message: "Signup failed",
      success: false,
      error: { message: "Internal server error." },
    };
    return res.status(500).json(response);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const parsedBody = loginValidation.safeParse(req.body);

  if (!parsedBody.success) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Invalid data format.",
      success: false,
      error: { message: parsedBody.error.issues[0].message },
    };

    return res.status(400).json(response);
  }

  const { email, password } = parsedBody.data;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Invalid credentials",
        success: false,
        error: { message: "Invalid credentials" },
      };

      return res.status(401).json(response);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Invalid credentials",
        success: false,
        error: { message: "Invalid credentials" },
      };

      return res.status(401).json(response);
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "10m" },
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" },
    );

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        token: refreshToken,
      },
    });

    const response: ApiResponse<LoginResponse> = {
      data: { accessToken },
      message: "Login successful.",
      success: true,
    };

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Login failed",
      success: false,
      error: { message: "Internal server error." },
    };
    return res.status(500).json(response);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Refresh token not found",
      success: false,
    };

    return res.status(401).json(response);
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as { id: string };

    if (!decoded.id) {
      console.log("Refresh token missing user id: ", decoded);

      const response: ApiResponse<null> = {
        data: null,
        message: "Invalid refresh token",
        success: false,
      };

      return res.status(401).json(response);
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: Number(decoded.id),
        revoked: false,
      },
    });

    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      res.clearCookie("refreshToken", refreshCookieOptions);

      const response: ApiResponse<null> = {
        data: null,
        message: "Invalid refresh token. Unauthorized.",
        success: false,
      };

      return res.status(401).json(response);
    }

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "10m" },
    );

    const response: ApiResponse<LoginResponse> = {
      data: { accessToken: newAccessToken },
      message: "Access token generated successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Access token generation failed",
      success: false,
      error: { message: "Internal server error." },
    };
    return res.status(500).json(response);
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  const user = req.user!;

  const response: ApiResponse<typeof user> = {
    data: user,
    message: "User data fetched successfully",
    success: true,
  };

  res.status(200).json(response);
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    await prisma.refreshToken.update({
      where: {
        token: refreshToken,
      },
      data: {
        revoked: true,
      },
    });
    res.clearCookie("refreshToken", refreshCookieOptions);

    const response: ApiResponse<null> = {
      data: null,
      message: "Logged out successfully.",
      success: true,
    };

    return res.status(200).json(response);
  }
};

export const resetPasswordLink = async (req: Request, res: Response) => {
  const parsedBody = resetPasswordValidation.safeParse(req.body);

  if (!parsedBody.success) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Invalid data format.",
      success: false,
      error: { message: parsedBody.error.issues[0].message },
    };

    return res.status(400).json(response);
  }

  const { email } = parsedBody.data;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.resetPasswordToken.create({
        data: {
          expiresAt,
          token,
          userId: user?.id,
        },
      });

      await sendResetPasswordLink(email, token);
    }

    const response: ApiResponse<null> = {
      data: null,
      message: "Password reset link sent to your registered email.",
      success: true,
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Password reset link could not be sent. Please try again later.",
      success: false,
      error: { message: "Internal server error." },
    };
    return res.status(500).json(response);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    const response: ApiResponse<null> = {
      data: null,
      message: "Token missing or invalid",
      success: false,
      error: { message: "Token missing or invalid" },
    };

    return res.status(404).json(response);
  }

  try {
    const storedToken = await prisma.resetPasswordToken.findUnique({
      where: {
        token: token,
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Invalid token",
        success: false,
      };

      return res.status(404).json(response);
    }

    const requiredBody = z.object({
      password: z
        .string({
          error: "Please enter your password before continuing.",
        })
        .min(8, { message: "Password should be at least 8 characters long." })
        .max(100, {
          message: "Password should not be more than 100 characters long.",
        }),
      confirmPassword: z
        .string({
          error: "Please confirm your password before continuing.",
        })
        .min(8, {
          error: "Confirm Password should be at least 8 characters long.",
        })
        .max(100, {
          error:
            "Confirm Password should not be more than 100 characters long.",
        }),
    });

    const parsedBody = requiredBody.safeParse(req.body);

    if (!parsedBody.success) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Invalid data format.",
        success: false,
        error: { message: parsedBody.error.issues[0].message },
      };

      return res.status(400).json(response);
    }

    const { password, confirmPassword } = parsedBody.data;

    if (password !== confirmPassword) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Password and confirm password don't match.",
        success: false,
        error: {
          message: "Password and confirm password don't match.",
        },
      };
      return res.status(401).json(response);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.findUnique({
      where: {
        id: storedToken.userId,
      },
    });

    if (!user) {
      const response: ApiResponse<null> = {
        data: null,
        message: "No user found",
        success: false,
        error: { message: "No user found" },
      };

      return res.status(401).json(response);
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    await prisma.resetPasswordToken.delete({
      where: {
        token: token,
      },
    });

    const response: ApiResponse<null> = {
      data: null,
      message: "Password reset successful. Please login again",
      success: true,
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Password could not reset successfully. Please try again later.",
      success: false,
      error: { message: "Internal server error." },
    };
    return res.status(500).json(response);
  }
};

export const editUser = async (req: Request, res: Response) => {
  const parsedBody = editUserValidationSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Invalid data format",
      success: false,
      error: {
        message: parsedBody.error.issues[0].message,
      },
    };

    return res.status(400).json(response);
  }

  if (Object.keys(parsedBody.data).length === 0) {
    const response: ApiResponse<null> = {
      data: null,
      message: "No fields provided to update",
      success: false,
    };

    return res.status(400).json(response);
  }

  try {
    const user = req.user!;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: parsedBody.data,
    });

    const response: ApiResponse<null> = {
      data: null,
      message: "Profile details updated successfully",
      success: true,
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error.code === "P2002") {
      const response: ApiResponse<null> = {
        data: null,
        message: "Email already exists",
        success: false,
        error: { message: "Email already exists." },
      };
      return res.status(409).json(response);
    }
    const response: ApiResponse<null> = {
      data: null,
      message:
        "Profile could not be updated successfully. Please try again later.",
      success: false,
      error: { message: "Internal server error." },
    };
    return res.status(500).json(response);
  }
};
