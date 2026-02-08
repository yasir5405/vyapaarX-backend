import { Router } from "express";
import { razorpayWebhook } from "../controllers/razorpay.webhook.controller";

const webhookRouter = Router();

webhookRouter.post("/razorpay", razorpayWebhook);

export { webhookRouter };
