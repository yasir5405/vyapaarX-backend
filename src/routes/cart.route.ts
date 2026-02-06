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

cartRouter.post("/", verifyJwt, addToCart); //done
cartRouter.get("/", verifyJwt, getCart); //done
cartRouter.put("/items/:productId", verifyJwt, updateCartItems); //done
cartRouter.delete("/items/:productId", verifyJwt, deleteCartItems); //done
cartRouter.delete("/", verifyJwt, clearCart); //done

export { cartRouter };
