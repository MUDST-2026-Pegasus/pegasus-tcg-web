import { z } from "zod";

/**
 * ตั้งให้ตรงกับ Bean Validation ใน `dto/SellerCancelOrderRequest.java`
 * (`@NotBlank @Size(max = 255)`) ถ้าฝั่งโน้นแก้ ต้องตามมาแก้ที่นี่
 *
 * ชื่อฟิลด์ `reason` ตรงกับ DTO อยู่แล้ว violations ที่หลุดมาจึงแปะช่องได้เลย
 */
export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "ระบุเหตุผล ผู้ซื้อจะเห็นข้อความนี้")
    .max(255, "เหตุผลต้องไม่เกิน 255 ตัวอักษร"),
});

export type CancelOrderValues = z.infer<typeof cancelOrderSchema>;

export const EMPTY_CANCEL_FORM: CancelOrderValues = {
  reason: "",
};
