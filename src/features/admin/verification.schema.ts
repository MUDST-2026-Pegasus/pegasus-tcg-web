import { z } from "zod";

/**
 * ตั้งให้ตรงกับ Bean Validation ใน `dto/RejectVerificationRequest.java`
 * (`@NotBlank @Size(max = 255)`) ถ้าฝั่งโน้นแก้ ต้องตามมาแก้ที่นี่
 *
 * ชื่อฟิลด์ `reason` ตรงกับ DTO อยู่แล้ว violations ที่หลุดมาจึงแปะช่องได้เลย
 */
export const rejectVerificationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "ระบุเหตุผลที่ปฏิเสธ เพื่อให้ผู้ขายรู้ว่าต้องแก้อะไร")
    .max(255, "เหตุผลต้องไม่เกิน 255 ตัวอักษร"),
});

export type RejectVerificationValues = z.infer<typeof rejectVerificationSchema>;

export const EMPTY_REJECT_FORM: RejectVerificationValues = {
  reason: "",
};
