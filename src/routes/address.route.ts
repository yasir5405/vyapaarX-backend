import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
  addAddress,
  getAddresses,
  updateAddress,
} from "../controllers/address.controller";

const addressRouter = Router();

addressRouter.post("/", verifyJwt, addAddress);
addressRouter.get("/", verifyJwt, getAddresses);
addressRouter.put("/:id", verifyJwt, updateAddress);

export { addressRouter };
