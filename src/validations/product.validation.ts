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
  companyName: z
    .string({ error: "Company name is required" })
    .min(3, { error: "Company name should be at least 3 characters long" })
    .max(150, { error: "Company name should be less than 150 characters" }),
  highlights: z.array(
    z
      .string({ error: "Highlight is required" })
      .min(3, { error: "Highlight should be at least 3 characters long" })
      .max(150, { error: "Highlight should be less than 150 characters" }),
  ),
  categoryId: z.number({ error: "Category ID must be provided" }),
});

export const updateProductValidationSchema = productValidationSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export const searchProductByIdValidation = z.object({
  productId: z.coerce.number({ error: "Product id is required" }),
});

export const getProductBySlugValidation = z.object({
  slug: z.string({ error: "Product slug must be provided" }),
});
