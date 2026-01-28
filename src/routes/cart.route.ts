import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
  addToCart,
  getCart,
  updateCartItems,
} from "../controllers/cart.controller";

const cartRouter = Router();

cartRouter.post("/", verifyJwt, addToCart);
cartRouter.get("/", verifyJwt, getCart);
cartRouter.put("/items/:productId", verifyJwt, updateCartItems);

export { cartRouter };
