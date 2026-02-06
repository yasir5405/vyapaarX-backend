const isProd = process.env.NODE_ENV === "production";

export const cookieConfig = {
  httpOnly: true,
  secure: isProd,
  sameSite: "none",
  domain: isProd ? ".vercel.app" : undefined,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};
