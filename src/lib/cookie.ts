import { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd, // HTTPS only in prod
  sameSite: isProd ? "none" : "lax", // cross-site only in prod
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

if (isProd) {
  refreshCookieOptions.domain = ".me-mora.xyz";
}
