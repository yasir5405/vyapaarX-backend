import { z } from "zod";

const registerValidationSchema = z.object({
  name: z
    .string({ error: "Full name is required." })
    .min(2, { error: "Name should be at least 2 characters long." })
    .max(100, { error: "Name should be less than 100 characters long." }),
  email: z.email({ error: "Please enter a valid email." }),
  password: z
    .string({ error: "Password is required." })
    .min(8, { error: "Password should be at least 8 characters long." })
    .max(100, { error: "Password cannot be more than 100 characters long." }),
});

const loginValidation = z.object({
  email: z.email({ error: "Please enter a valid email." }),
  password: z
    .string({ error: "Password is required." })
    .min(8, { error: "Password should be at least 8 characters long." })
    .max(100, { error: "Password cannot be more than 100 characters long." }),
});

const resetPasswordValidation = z.object({
  email: z.email({ error: "Please enter a valid email." }),
});

const editUserValidationSchema = registerValidationSchema
  .omit({ password: true })
  .partial();

export {
  registerValidationSchema,
  loginValidation,
  resetPasswordValidation,
  editUserValidationSchema,
};
