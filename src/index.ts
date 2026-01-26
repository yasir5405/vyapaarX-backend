import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.route";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to VyapaarX",
  });
});

app.use("/api/auth", authRouter);

export default app;
