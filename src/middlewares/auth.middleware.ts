import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../schemas/common.response";
import { prisma } from "../lib/prisma";

export const verifyJwt = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Unauthorized",
      success: false,
    };
    return res.status(401).json(response);
  }

  const accessToken = authHeader.split(" ")[1];

  if (!accessToken) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Unauthorized",
      success: false,
    };
    return res.status(401).json(response);
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as {
      id: string;
    };

    if (!decoded.id) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Unauthorized",
        success: false,
      };
      return res.status(401).json(response);
    }

    const userId = decoded.id;

    const user = await prisma.user.findUnique({
      where: {
        id: +userId,
      },
      include: {
        addresses: true,
      },
    });

    if (!user) {
      const response: ApiResponse<null> = {
        data: null,
        message: "Unauthorized",
        success: false,
      };
      return res.status(401).json(response);
    }

    const { password: _, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      // console.log("Token has expired");
      return res.status(401).json({ success: false, message: "Token expired" });
    } else {
      // console.log("Token invalid for other reasons");
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  }
};

export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user!;

  if (user.role !== "Admin") {
    const response: ApiResponse<null> = {
      data: null,
      message: "Only admins can perform this action",
      success: false,
      error: {
        message: "Unauthorised",
      },
    };

    return res.status(403).json(response);
  }

  next();
};
