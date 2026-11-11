import { z } from "zod";

import { translate } from "@/lib/i18n";

// @tolgee-key {"key": "verification.validation.reasonRequired", "ns": "admin", "defaultValue": "ระบุเหตุผลที่ปฏิเสธ เพื่อให้ผู้ขายรู้ว่าต้องแก้อะไร"}
// @tolgee-key {"key": "verification.validation.reasonMax", "ns": "admin", "defaultValue": "เหตุผลต้องไม่เกิน 255 ตัวอักษร"}

/**
 * ตั้งให้ตรงกับ Bean Validation ใน `dto/RejectVerificationRequest.java`
 * (`@NotBlank @Size(max = 255)`) ถ้าฝั่งโน้นแก้ ต้องตามมาแก้ที่นี่
 *
 * ชื่อฟิลด์ `reason` ตรงกับ DTO อยู่แล้ว violations ที่หลุดมาจึงแปะช่องได้เลย
 */
export const rejectVerificationSchema = () =>
  z.object({
    reason: z
      .string()
      .trim()
      .min(
        1,
        translate(
          "admin",
          "verification.validation.reasonRequired",
          "ระบุเหตุผลที่ปฏิเสธ เพื่อให้ผู้ขายรู้ว่าต้องแก้อะไร",
        ),
      )
      .max(
        255,
        translate(
          "admin",
          "verification.validation.reasonMax",
          "เหตุผลต้องไม่เกิน 255 ตัวอักษร",
        ),
      ),
  });

export type RejectVerificationValues = z.infer<ReturnType<typeof rejectVerificationSchema>>;

export const EMPTY_REJECT_FORM: RejectVerificationValues = {
  reason: "",
};
