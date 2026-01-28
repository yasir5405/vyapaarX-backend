import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
  addToCart,
  clearCart,
  deleteCartItems,
  getCart,
  updateCartItems,
} from "../controllers/cart.controller";

const cartRouter = Router();

cartRouter.post("/", verifyJwt, addToCart);
cartRouter.get("/", verifyJwt, getCart);
cartRouter.put("/items/:productId", verifyJwt, updateCartItems);
cartRouter.delete("/items/:productId", verifyJwt, deleteCartItems);
cartRouter.delete("/", verifyJwt, clearCart);

export { cartRouter };
