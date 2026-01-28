import { Router } from "express";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware";
import {
  addProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";

const productRouter = Router();

productRouter.post("/", verifyJwt, verifyAdmin, addProduct);
productRouter.get("/", getProducts);
productRouter.get("/:productId", getProduct);
productRouter.put("/:productId", verifyJwt, verifyAdmin, updateProduct);

export { productRouter };
