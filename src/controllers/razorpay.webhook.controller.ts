import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { ApiResponse } from "../schemas/common.response";

export const razorpayWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const event = JSON.parse(req.body.toString());

  try {
    if (event.event === "payment.captured") {
      console.log(
        "💰 Payment captured:",
        event.payload.payment.entity.order_id,
      );
      const payment = event.payload.payment.entity;

      await prisma.order.updateMany({
        where: {
          razorpayOrderId: payment.order_id,
          status: "PENDING",
        },
        data: {
          status: "PAID",
          razorpayPaymentId: payment.id,
        },
      });
    }

    if (event.event === "payment.failed") {
      console.log("❌ Payment failed:", event.payload.payment.entity.order_id);
      const payment = event.payload.payment.entity;

      await prisma.order.updateMany({
        where: {
          razorpayOrderId: payment.order_id,
          status: "PENDING",
        },
        data: {
          status: "FAILED",
        },
      });
    }

    return res.json({ received: true });
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      message: "Webhook handler failed. Please try again",
      success: false,
      error: {
        message: "Internal server error",
      },
    };

    return res.status(500).json(response);
  }
};
