import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import { addToCart } from "../controllers/cart.controller";

const cartRouter = Router();

cartRouter.post("/", verifyJwt, addToCart);

export { cartRouter };
