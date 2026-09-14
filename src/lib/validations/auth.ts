import { z } from "zod";

const email = z
  .string({ error: "Enter your email." })
  .trim()
  .toLowerCase()
  .min(1, "Enter your email.")
  .max(254, "That email is too long.")
  .pipe(z.email("Enter a valid email, like name@example.com."));

export const signupSchema = z.object({
  name: z
    .string({ error: "Enter your name." })
    .trim()
    .min(1, "Enter your name.")
    .min(2, "Enter at least 2 characters.")
    .max(60, "Keep your name under 60 characters."),
  email,
  // bcrypt only uses the first 72 bytes, so longer passwords are rejected rather than silently truncated.
  password: z
    .string({ error: "Choose a password." })
    .min(8, "Use at least 8 characters.")
    .max(72, "Use 72 characters or fewer."),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Enter your password." }).min(1, "Enter your password.").max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
