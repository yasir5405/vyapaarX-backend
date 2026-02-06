import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { authRouter } from "./routes/auth.route";
import { addressRouter } from "./routes/address.route";
import { productRouter } from "./routes/product.route";
import { cartRouter } from "./routes/cart.route";
import { orderRouter } from "./routes/order.route";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
  }),
);
app.use(helmet());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to VyapaarX",
  });
});

app.use("/api/auth", authRouter); //done
app.use("/api/products", productRouter); //done
app.use("/api/addresses", addressRouter);
app.use("/api/cart", cartRouter); //done
app.use("/api/orders", orderRouter);

export default app;
