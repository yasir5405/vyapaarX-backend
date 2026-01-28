import { z } from "zod";

export const orderValidationSchema = z.object({
  addressId: z.coerce.number({ error: "Valid address id is required" }),
});
