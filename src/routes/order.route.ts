import { Router } from "express";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware";
import {
  addOrder,
  cancelOrder,
  getAdminOverview,
  getAllOrders,
  getOrder,
  getOrders,
  updateOrderStatus,
  verifyPayment,
} from "../controllers/order.controller";

const orderRouter = Router();

orderRouter.post("/", verifyJwt, addOrder); //done
orderRouter.post("/verify-payment", verifyJwt, verifyPayment); //done
orderRouter.get("/", verifyJwt, getOrders); //done
orderRouter.get("/admin", verifyJwt, verifyAdmin, getAllOrders); //done
orderRouter.get("/admin/overview", verifyJwt, verifyAdmin, getAdminOverview);
orderRouter.patch(
  "/admin/:orderId/status",
  verifyJwt,
  verifyAdmin,
  updateOrderStatus,
); //done
orderRouter.patch("/:orderId/cancel", verifyJwt, cancelOrder); //done
orderRouter.get("/:orderId", verifyJwt, getOrder); //done
export { orderRouter };
