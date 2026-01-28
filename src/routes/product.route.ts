import { Router } from "express";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware";
import { addProduct, getProducts } from "../controllers/product.controller";

const productRouter = Router();

productRouter.post("/", verifyJwt, verifyAdmin, addProduct);
productRouter.get("/", getProducts);

export { productRouter };
