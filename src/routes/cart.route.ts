import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import { addToCart, getCart } from "../controllers/cart.controller";

const cartRouter = Router();

cartRouter.post("/", verifyJwt, addToCart);
cartRouter.get("/", verifyJwt, getCart);

export { cartRouter };
