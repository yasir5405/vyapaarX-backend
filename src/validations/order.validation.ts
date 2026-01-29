import { z } from "zod";

export const orderValidationSchema = z.object({
  addressId: z.coerce.number({ error: "Valid address id is required" }),
});

export const orderDetailsValidationSchema = z.object({
  orderId: z.coerce.number({ error: "Valid order id is required" }),
});

export const updateOrderStatusValidationSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"], {
    error: "Invalid order status",
  }),
});
