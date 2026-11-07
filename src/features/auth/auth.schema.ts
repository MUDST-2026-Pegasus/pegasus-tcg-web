import { translate } from "@/lib/language";
import { z } from "zod";

/**
 * ตั้งให้ตรงกับ Bean Validation ของ DTO ฝั่ง backend ถ้าฝั่งโน้นแก้กติกา ต้องตามมาแก้ที่นี่
 */

const email = z
  .string()
  .trim()
  .min(1, { error: () => translate("กรุณากรอกอีเมล", "Email is required") })
  .max(255, { error: () => translate("อีเมลต้องไม่เกิน 255 ตัวอักษร", "Email must be at most 255 characters") })
  .pipe(z.email({ error: () => translate("กรุณากรอกอีเมลที่ถูกต้อง", "Enter a valid email address") }));

const password = z
  .string()
  .min(8, { error: () => translate("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "Password must be at least 8 characters") })
  .max(128, { error: () => translate("รหัสผ่านต้องไม่เกิน 128 ตัวอักษร", "Password must be at most 128 characters") });

const username = z
  .string()
  .trim()
  .min(3, { error: () => translate("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร", "Username must be at least 3 characters") })
  .max(50, { error: () => translate("ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร", "Username must be at most 50 characters") })
  .regex(
    /^[A-Za-z0-9_]+$/,
    { error: () => translate("ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร ตัวเลข และขีดล่าง", "Username may only contain letters, digits and underscores") },
  );

const displayName = z
  .string()
  .trim()
  .min(1, { error: () => translate("กรุณากรอกชื่อที่แสดง", "Display name is required") })
  .max(100, { error: () => translate("ชื่อที่แสดงต้องไม่เกิน 100 ตัวอักษร", "Display name must be at most 100 characters") });

const phone = z
  .string()
  .trim()
  .max(20, { error: () => translate("หมายเลขโทรศัพท์ต้องไม่เกิน 20 ตัวอักษร", "Phone number must be at most 20 characters") })
  .regex(/^[0-9+()\-\s]*$/, { error: () => translate("กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง", "Enter a valid phone number") })
  .optional();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: () => translate("กรุณากรอกรหัสผ่าน", "Password is required") }).max(128),
});

export const registerSchema = z.object({
  username,
  displayName,
  email,
  password,
  confirmPassword: z.string(),
  phone,
  acceptTerms: z.literal(true, {
    error: () => translate("กรุณายอมรับเงื่อนไขการใช้บริการและนโยบายความเป็นส่วนตัว", "Please accept the Terms of Service and Privacy Policy"),
  }),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  error: () => translate("รหัสผ่านไม่ตรงกัน", "Passwords do not match"),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { error: () => translate("กรุณาระบุโทเค็นรีเซ็ตรหัสผ่าน", "Reset token is required") }).max(512),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    error: () => translate("รหัสผ่านไม่ตรงกัน", "Passwords do not match"),
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: () => translate("กรุณากรอกรหัสผ่านปัจจุบัน", "Current password is required") }).max(128),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    error: () => translate("รหัสผ่านไม่ตรงกัน", "Passwords do not match"),
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
