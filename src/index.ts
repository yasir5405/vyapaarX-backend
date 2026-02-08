import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { authRouter } from "./routes/auth.route";
import { addressRouter } from "./routes/address.route";
import { productRouter } from "./routes/product.route";
import { cartRouter } from "./routes/cart.route";
import { orderRouter } from "./routes/order.route";
import { razorpayWebhook } from "./controllers/razorpay.webhook.controller";

const app = express();

app.set("trust proxy", 1);

app.use(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhook,
);

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to VyapaarX",
  });
});

app.use("/api/auth", authRouter); //done
app.use("/api/products", productRouter); //done
app.use("/api/addresses", addressRouter); //done
app.use("/api/cart", cartRouter); //done
app.use("/api/orders", orderRouter);

export default app;
