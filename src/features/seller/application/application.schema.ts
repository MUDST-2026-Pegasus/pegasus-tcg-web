import { z } from "zod";

import {
  BANK_BOOK_MAX_BYTES,
  BANK_BOOK_TYPES,
  BANK_ITEMS,
} from "./application.constants";

/**
 * ชื่อ ธนาคาร และเลขบัญชี ตั้งให้ตรงกับ Bean Validation ของ `VerificationRequest`
 * ถ้าฝั่งโน้นแก้กติกา ต้องตามมาแก้ที่นี่
 *
 * รูปสมุดบัญชีกับการยอมรับเงื่อนไขตรวจแค่ฝั่งหน้าเว็บ backend ยังไม่มีช่องรับ
 */
export const sellerApplicationSchema = z.object({
  legalFirstName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อจริง")
    .max(100, "ชื่อจริงยาวได้ไม่เกิน 100 ตัวอักษร"),
  legalLastName: z
    .string()
    .trim()
    .min(1, "กรุณากรอกนามสกุลจริง")
    .max(100, "นามสกุลยาวได้ไม่เกิน 100 ตัวอักษร"),
  bankCode: z
    .string()
    .refine((code) => code in BANK_ITEMS, "กรุณาเลือกธนาคาร"),
  bankAccountNumber: z
    .string()
    .trim()
    .min(1, "กรุณากรอกเลขที่บัญชี")
    .max(34, "เลขที่บัญชียาวเกินไป")
    .regex(/^[0-9\-\s]+$/, "ใช้ได้เฉพาะตัวเลข ขีด (-) และช่องว่าง")
    .refine(
      (value) => value.replace(/\D/g, "").length >= 10,
      "เลขที่บัญชีต้องมีอย่างน้อย 10 หลัก",
    ),
  bankBook: z
    .file({ error: "กรุณาแนบรูปหน้าสมุดบัญชีหรือหน้าแอปธนาคาร" })
    .mime([...BANK_BOOK_TYPES], { error: "รองรับเฉพาะไฟล์ JPG หรือ PNG" })
    .max(BANK_BOOK_MAX_BYTES, { error: "ไฟล์ต้องมีขนาดไม่เกิน 5 MB" }),
  acceptTerms: z.literal(true, {
    error: "กรุณายืนยันข้อมูลและยอมรับเงื่อนไขก่อนส่งคำขอ",
  }),
});

export type SellerApplicationFormValues = z.infer<
  typeof sellerApplicationSchema
>;
