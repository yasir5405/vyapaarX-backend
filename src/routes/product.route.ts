import { Router } from "express";
import { verifyAdmin, verifyJwt } from "../middlewares/auth.middleware";
import {
  addProduct,
  getHomeProducts,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";

const productRouter = Router();

productRouter.post("/", verifyJwt, verifyAdmin, addProduct); //done
productRouter.get("/", getProducts); //done
productRouter.get("/home", getHomeProducts);
productRouter.get("/:productId", getProduct); //done
productRouter.put("/:productId", verifyJwt, verifyAdmin, updateProduct); //done

export { productRouter };
