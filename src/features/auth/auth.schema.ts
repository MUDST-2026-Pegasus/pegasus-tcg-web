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
    .min(1, t("auth.validation.emailRequired", "กรุณากรอกอีเมล"))
    .max(255, t("auth.validation.emailMax", "อีเมลต้องไม่เกิน {max} ตัวอักษร", { max: 255 }))
    .pipe(z.email(t("auth.validation.emailInvalid", "กรอกอีเมลให้ถูกต้อง")));

  const password = z
    .string()
    .min(8, t("auth.validation.passwordMin", "รหัสผ่านต้องมีอย่างน้อย {min} ตัวอักษร", { min: 8 }))
    .max(128, t("auth.validation.passwordMax", "รหัสผ่านต้องไม่เกิน {max} ตัวอักษร", { max: 128 }));

  const username = z
    .string()
    .trim()
    .min(3, t("auth.validation.usernameMin", "ชื่อผู้ใช้ต้องมีอย่างน้อย {min} ตัวอักษร", { min: 3 }))
    .max(50, t("auth.validation.usernameMax", "ชื่อผู้ใช้ต้องไม่เกิน {max} ตัวอักษร", { max: 50 }))
    .regex(
      /^[A-Za-z0-9_]+$/,
      t("auth.validation.usernamePattern", "ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีดล่าง"),
    );

  const displayName = z
    .string()
    .trim()
    .min(1, t("auth.validation.displayNameRequired", "กรุณากรอกชื่อที่แสดง"))
    .max(100, t("auth.validation.displayNameMax", "ชื่อที่แสดงต้องไม่เกิน {max} ตัวอักษร", { max: 100 }));

  const phone = z
    .string()
    .trim()
    .max(20, t("auth.validation.phoneMax", "เบอร์โทรศัพท์ต้องไม่เกิน {max} ตัวอักษร", { max: 20 }))
    .regex(/^[0-9+()\-\s]*$/, t("auth.validation.phoneInvalid", "กรอกเบอร์โทรศัพท์ให้ถูกต้อง"))
    .optional();

  const loginSchema = z.object({
    email,
    password: z.string().min(1, t("auth.validation.passwordRequired", "กรุณากรอกรหัสผ่าน")).max(128),
  });

  const registerSchema = z.object({
    username,
    displayName,
    email,
    password,
    confirmPassword: z.string(),
    phone,
    acceptTerms: z.literal(true, {
      error: t("auth.validation.acceptTerms", "กรุณายอมรับข้อกำหนดการใช้บริการและนโยบายความเป็นส่วนตัว"),
    }),
  }).refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: t("auth.validation.passwordMismatch", "รหัสผ่านไม่ตรงกัน"),
  });

  const forgotPasswordSchema = z.object({ email });

  const resetPasswordSchema = z
    .object({
      token: z.string().min(1, t("auth.validation.resetTokenRequired", "ไม่พบรหัสสำหรับรีเซ็ตรหัสผ่าน")).max(512),
      newPassword: password,
      confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      path: ["confirmPassword"],
      error: t("auth.validation.passwordMismatch", "รหัสผ่านไม่ตรงกัน"),
    });

  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, t("auth.validation.currentPasswordRequired", "กรุณากรอกรหัสผ่านปัจจุบัน")).max(128),
      newPassword: password,
      confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      path: ["confirmPassword"],
      error: t("auth.validation.passwordMismatch", "รหัสผ่านไม่ตรงกัน"),
    });

  return { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema };
}

type AuthSchemas = ReturnType<typeof useAuthSchemas>;
export type LoginFormValues = z.infer<AuthSchemas["loginSchema"]>;
export type RegisterFormValues = z.infer<AuthSchemas["registerSchema"]>;
export type ForgotPasswordFormValues = z.infer<AuthSchemas["forgotPasswordSchema"]>;
export type ResetPasswordFormValues = z.infer<AuthSchemas["resetPasswordSchema"]>;
export type ChangePasswordFormValues = z.infer<AuthSchemas["changePasswordSchema"]>;
