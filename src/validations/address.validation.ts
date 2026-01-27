import { z } from "zod";

export const addressValidationSchema = z.object({
  addressLine: z
    .string({ error: "Address line is required" })
    .min(10, { error: "Address line should be at least 10 characters long" })
    .max(255, {
      error: "Address line should be less than 255 characters long",
    }),
  city: z
    .string({ error: "City is required" })
    .min(2, { error: "City must be at least 2 characters long" })
    .max(100, { error: "City should be less than 100 characters long" }),
  state: z
    .string({ error: "State is required" })
    .min(2, { error: "State must be at least 2 characters long" })
    .max(100, { error: "State should be less than 100 characters long" }),
  postalCode: z
    .string({ error: "Postal code is required" })
    .regex(/^[1-9][0-9]{5}$/, {
      message: "Enter a valid 6-digit PIN code.",
    }),
  country: z
    .string({ error: "Country is required" })
    .min(2, { error: "Country must be at least 2 characters long" })
    .max(100, { error: "Country should be less than 100 characters long" }),
});

export const updateAddressValidationSchema = addressValidationSchema.partial();
