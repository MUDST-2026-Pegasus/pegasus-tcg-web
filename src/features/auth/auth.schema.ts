import { z } from "zod";

/**
 * ตั้งให้ตรงกับ Bean Validation ของ DTO ฝั่ง backend ถ้าฝั่งโน้นแก้กติกา ต้องตามมาแก้ที่นี่
 */

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email must be at most 255 characters")
  .pipe(z.email("Enter a valid email address"));

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

const username = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be at most 50 characters")
  .regex(
    /^[A-Za-z0-9_]+$/,
    "Username may only contain letters, digits and underscores",
  );

const displayName = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(100, "Display name must be at most 100 characters");

const phone = z
  .string()
  .trim()
  .max(20, "Phone number must be at most 20 characters")
  .regex(/^[0-9+()\-\s]*$/, "Enter a valid phone number")
  .optional();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z.object({
  username,
  displayName,
  email,
  password,
  phone,
  acceptTerms: z.literal(true, {
    error: "Please accept the Terms of Service and Privacy Policy",
  }),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required").max(512),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match",
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
