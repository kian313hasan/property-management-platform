import { z } from "zod";
import { emailSchema, passwordSchema } from "./common";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const passwordResetCompletionSchema = z
  .object({
    token: z.string().min(1).max(256),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"] });

export type LoginInput = z.infer<typeof loginSchema>;
