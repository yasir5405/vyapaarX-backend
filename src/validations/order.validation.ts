import { z } from "zod";

export const orderValidationSchema = z.object({
  addressId: z.coerce.number({ error: "Valid address id is required" }),
});

export const orderDetailsValidationSchema = z.object({
  orderId: z.coerce.number({ error: "Valid order id is required" }),
});
