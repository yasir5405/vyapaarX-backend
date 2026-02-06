import { Router } from "express";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware";
import {
  addOrder,
  getAdminOverview,
  getAllOrders,
  getOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/order.controller";

const orderRouter = Router();

orderRouter.post("/", verifyJwt, addOrder); //done
orderRouter.get("/", verifyJwt, getOrders);
orderRouter.get("/admin", verifyJwt, verifyAdmin, getAllOrders);
orderRouter.get("/admin/overview", verifyJwt, verifyAdmin, getAdminOverview);
orderRouter.patch(
  "/admin/:orderId/status",
  verifyJwt,
  verifyAdmin,
  updateOrderStatus,
);
orderRouter.get("/:orderId", verifyJwt, getOrder);
export { orderRouter };
