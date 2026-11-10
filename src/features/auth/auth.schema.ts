import { z } from "zod";

import { useTranslate } from "@/lib/i18n";

/**
 * ตั้งให้ตรงกับ Bean Validation ของ DTO ฝั่ง backend ถ้าฝั่งโน้นแก้กติกา ต้องตามมาแก้ที่นี่
 */

/** schema ที่ข้อความ validation ตามภาษาปัจจุบัน — เป็น hook เพื่อให้ tolgee CLI extract key จาก t() ได้ [TCG-551] */
export function useAuthSchemas() {
  const { t } = useTranslate("buyer");

  const email = z
    .string()
    .trim()
    .min(1, t("auth.validation.emailRequired", "Email is required"))
    .max(255, t("auth.validation.emailMax", "Email must be at most {max} characters", { max: 255 }))
    .pipe(z.email(t("auth.validation.emailInvalid", "Enter a valid email address")));

  const password = z
    .string()
    .min(8, t("auth.validation.passwordMin", "Password must be at least {min} characters", { min: 8 }))
    .max(128, t("auth.validation.passwordMax", "Password must be at most {max} characters", { max: 128 }));

  const username = z
    .string()
    .trim()
    .min(3, t("auth.validation.usernameMin", "Username must be at least {min} characters", { min: 3 }))
    .max(50, t("auth.validation.usernameMax", "Username must be at most {max} characters", { max: 50 }))
    .regex(
      /^[A-Za-z0-9_]+$/,
      t("auth.validation.usernamePattern", "Username may only contain letters, digits and underscores"),
    );

  const displayName = z
    .string()
    .trim()
    .min(1, t("auth.validation.displayNameRequired", "Display name is required"))
    .max(100, t("auth.validation.displayNameMax", "Display name must be at most {max} characters", { max: 100 }));

  const phone = z
    .string()
    .trim()
    .max(20, t("auth.validation.phoneMax", "Phone number must be at most {max} characters", { max: 20 }))
    .regex(/^[0-9+()\-\s]*$/, t("auth.validation.phoneInvalid", "Enter a valid phone number"))
    .optional();

  const loginSchema = z.object({
    email,
    password: z.string().min(1, t("auth.validation.passwordRequired", "Password is required")).max(128),
  });

  const registerSchema = z.object({
    username,
    displayName,
    email,
    password,
    confirmPassword: z.string(),
    phone,
    acceptTerms: z.literal(true, {
      error: t("auth.validation.acceptTerms", "Please accept the Terms of Service and Privacy Policy"),
    }),
  }).refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: t("auth.validation.passwordMismatch", "Passwords do not match"),
  });

  const forgotPasswordSchema = z.object({ email });

  const resetPasswordSchema = z
    .object({
      token: z.string().min(1, t("auth.validation.resetTokenRequired", "Reset token is required")).max(512),
      newPassword: password,
      confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      path: ["confirmPassword"],
      error: t("auth.validation.passwordMismatch", "Passwords do not match"),
    });

  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, t("auth.validation.currentPasswordRequired", "Current password is required")).max(128),
      newPassword: password,
      confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      path: ["confirmPassword"],
      error: t("auth.validation.passwordMismatch", "Passwords do not match"),
    });

  return { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema };
}

type AuthSchemas = ReturnType<typeof useAuthSchemas>;
export type LoginFormValues = z.infer<AuthSchemas["loginSchema"]>;
export type RegisterFormValues = z.infer<AuthSchemas["registerSchema"]>;
export type ForgotPasswordFormValues = z.infer<AuthSchemas["forgotPasswordSchema"]>;
export type ResetPasswordFormValues = z.infer<AuthSchemas["resetPasswordSchema"]>;
export type ChangePasswordFormValues = z.infer<AuthSchemas["changePasswordSchema"]>;
