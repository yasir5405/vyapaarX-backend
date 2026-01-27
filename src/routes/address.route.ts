import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "../controllers/address.controller";

const addressRouter = Router();

addressRouter.post("/", verifyJwt, addAddress);
addressRouter.get("/", verifyJwt, getAddresses);
addressRouter.put("/:id", verifyJwt, updateAddress);
addressRouter.delete("/:id", verifyJwt, deleteAddress);
addressRouter.patch("/:id/default", verifyJwt, setDefaultAddress);

export { addressRouter };
