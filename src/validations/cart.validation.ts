import { z } from "zod";

export const cartValidationSchema = z.object({
  productId: z.number({ error: "Please provide the product id" }),
  quantity: z.number({ error: "Please provide the quantity" }),
});
