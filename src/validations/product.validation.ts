import { z } from "zod";

export const productValidationSchema = z.object({
  name: z
    .string({ error: "Product name is required" })
    .min(3, { error: "Product name should be at least 3 characters long" })
    .max(150, { error: "Product name should be less than 150 characters" }),
  description: z
    .string()
    .min(10, { error: "Description must be at least 10 characters long" })
    .max(2000, { error: "Description must not exceed 2000 characters" })
    .optional(),
  price: z.number({ error: "Price of the product is required" }),
});

export const updateProductValidationSchema = productValidationSchema.partial();

export const searchProductByIdValidation = z.object({
  productId: z.coerce.number({ error: "Product id is required" }),
});
