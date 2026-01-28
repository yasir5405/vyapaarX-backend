import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import { addOrder } from "../controllers/order.controller";

const orderRouter = Router();

orderRouter.post("/", verifyJwt, addOrder);

export { orderRouter };
