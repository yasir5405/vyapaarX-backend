import { Router } from "express";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware";
import {
  addOrder,
  getAllOrders,
  getOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/order.controller";

const orderRouter = Router();

orderRouter.post("/", verifyJwt, addOrder);
orderRouter.get("/", verifyJwt, getOrders);
orderRouter.get("/admin", verifyJwt, verifyAdmin, getAllOrders);
orderRouter.patch("/admin/:orderId/status", verifyJwt, verifyAdmin, updateOrderStatus);
orderRouter.get("/:orderId", verifyJwt, getOrder);
export { orderRouter };
