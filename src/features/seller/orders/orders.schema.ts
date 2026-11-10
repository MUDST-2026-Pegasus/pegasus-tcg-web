import { z } from "zod";
import { translate } from "@/lib/i18n";

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
    .min(1, { error: () => translate("seller", "orders.cancel.reasonRequired", "ระบุเหตุผล ผู้ซื้อจะเห็นข้อความนี้") })
    .max(255, { error: () => translate("seller", "orders.cancel.reasonTooLong", "เหตุผลต้องไม่เกิน 255 ตัวอักษร") }),
});

export type CancelOrderValues = z.infer<typeof cancelOrderSchema>;

export const EMPTY_CANCEL_FORM: CancelOrderValues = {
  reason: "",
};

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "orders.cancel.reasonRequired", "ns": "seller", "defaultValue": "ระบุเหตุผล ผู้ซื้อจะเห็นข้อความนี้"}
// @tolgee-key {"key": "orders.cancel.reasonTooLong", "ns": "seller", "defaultValue": "เหตุผลต้องไม่เกิน 255 ตัวอักษร"}
