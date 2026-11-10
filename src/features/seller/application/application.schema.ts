import { z } from "zod";

import { BANK_ITEMS } from "./application.constants";
import { translate } from "@/lib/i18n";

/**
 * ชื่อ ธนาคาร เลขบัญชี และ key ของรูป ตั้งให้ตรงกับ Bean Validation ของ
 * `VerificationRequest` ถ้าฝั่งโน้นแก้กติกา ต้องตามมาแก้ที่นี่
 *
 * ตัวไฟล์รูปไม่อยู่ในฟอร์ม — `useFileUpload()` อัปขึ้น object storage และตรวจ
 * ชนิด/ขนาดไปแล้ว ฟอร์มถือแค่ object key ที่ได้กลับมา
 * การยอมรับเงื่อนไขตรวจแค่ฝั่งหน้าเว็บ backend ไม่มีช่องรับ
 */
export const sellerApplicationSchema = z.object({
  legalFirstName: z
    .string()
    .trim()
    .min(1, { error: () => translate("seller", "application.validation.firstNameRequired", "กรุณากรอกชื่อจริง") })
    .max(100, { error: () => translate("seller", "application.validation.firstNameTooLong", "ชื่อจริงยาวได้ไม่เกิน 100 ตัวอักษร") }),
  legalLastName: z
    .string()
    .trim()
    .min(1, { error: () => translate("seller", "application.validation.lastNameRequired", "กรุณากรอกนามสกุลจริง") })
    .max(100, { error: () => translate("seller", "application.validation.lastNameTooLong", "นามสกุลยาวได้ไม่เกิน 100 ตัวอักษร") }),
  bankCode: z
    .string()
    .refine((code) => code in BANK_ITEMS, { error: () => translate("seller", "application.validation.bankRequired", "กรุณาเลือกธนาคาร") }),
  bankAccountNumber: z
    .string()
    .trim()
    .min(1, { error: () => translate("seller", "application.validation.accountRequired", "กรุณากรอกเลขที่บัญชี") })
    .max(34, { error: () => translate("seller", "application.validation.accountTooLong", "เลขที่บัญชียาวเกินไป") })
    .regex(/^[0-9\-\s]+$/, { error: () => translate("seller", "application.validation.accountChars", "ใช้ได้เฉพาะตัวเลข ขีด (-) และช่องว่าง") })
    .refine(
      (value) => value.replace(/\D/g, "").length >= 10,
      { error: () => translate("seller", "application.validation.accountMinDigits", "เลขที่บัญชีต้องมีอย่างน้อย 10 หลัก") },
    ),
  bankBookImageKey: z
    .string()
    .min(1, { error: () => translate("seller", "application.validation.bankBookRequired", "กรุณาแนบรูปหน้าสมุดบัญชีหรือหน้าแอปธนาคาร") })
    .max(500),
  acceptTerms: z.literal(true, {
    error: () => translate("seller", "application.validation.acceptTerms", "กรุณายืนยันข้อมูลและยอมรับเงื่อนไขก่อนส่งคำขอ"),
  }),
});

export type SellerApplicationFormValues = z.infer<
  typeof sellerApplicationSchema
>;

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "application.validation.firstNameRequired", "ns": "seller", "defaultValue": "กรุณากรอกชื่อจริง"}
// @tolgee-key {"key": "application.validation.firstNameTooLong", "ns": "seller", "defaultValue": "ชื่อจริงยาวได้ไม่เกิน 100 ตัวอักษร"}
// @tolgee-key {"key": "application.validation.lastNameRequired", "ns": "seller", "defaultValue": "กรุณากรอกนามสกุลจริง"}
// @tolgee-key {"key": "application.validation.lastNameTooLong", "ns": "seller", "defaultValue": "นามสกุลยาวได้ไม่เกิน 100 ตัวอักษร"}
// @tolgee-key {"key": "application.validation.bankRequired", "ns": "seller", "defaultValue": "กรุณาเลือกธนาคาร"}
// @tolgee-key {"key": "application.validation.accountRequired", "ns": "seller", "defaultValue": "กรุณากรอกเลขที่บัญชี"}
// @tolgee-key {"key": "application.validation.accountTooLong", "ns": "seller", "defaultValue": "เลขที่บัญชียาวเกินไป"}
// @tolgee-key {"key": "application.validation.accountChars", "ns": "seller", "defaultValue": "ใช้ได้เฉพาะตัวเลข ขีด (-) และช่องว่าง"}
// @tolgee-key {"key": "application.validation.accountMinDigits", "ns": "seller", "defaultValue": "เลขที่บัญชีต้องมีอย่างน้อย 10 หลัก"}
// @tolgee-key {"key": "application.validation.bankBookRequired", "ns": "seller", "defaultValue": "กรุณาแนบรูปหน้าสมุดบัญชีหรือหน้าแอปธนาคาร"}
// @tolgee-key {"key": "application.validation.acceptTerms", "ns": "seller", "defaultValue": "กรุณายืนยันข้อมูลและยอมรับเงื่อนไขก่อนส่งคำขอ"}
