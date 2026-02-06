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

addressRouter.post("/", verifyJwt, addAddress); //done
addressRouter.get("/", verifyJwt, getAddresses); //done
addressRouter.put("/:id", verifyJwt, updateAddress); //done
addressRouter.delete("/:id", verifyJwt, deleteAddress); //done
addressRouter.patch("/:id/default", verifyJwt, setDefaultAddress); //done

export { addressRouter };
