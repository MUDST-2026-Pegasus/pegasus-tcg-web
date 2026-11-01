import { z } from "zod";
import { money } from "./promotions.format";
import type { SellerPromotion, SellerPromotionInput } from "./promotions.types";

export const sellerPromotionSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/, "รหัสต้องเป็น A-Z หรือ 0-9 จำนวน 4–20 ตัว"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อ"),
  description: z.string().nullable(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive("ส่วนลดต้องมากกว่า 0"),
  maxDiscount: z.number().nullable(),
  minSpend: z.number().nonnegative("ยอดขั้นต่ำต้องไม่ติดลบ"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  newBuyerOnly: z.boolean(),
  usageLimitTotal: z.number().nullable(),
  usageLimitPerUser: z.number(),
  claimable: z.boolean(),
  claimLimit: z.number().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
});

export function schemaForSellerPromotion(existing?: Partial<SellerPromotion>) {
  return sellerPromotionSchema.superRefine((form, context) => {
    const issue = (path: keyof SellerPromotionInput, message: string) =>
      context.addIssue({ code: "custom", path: [path], message });
    if (form.discountType === "PERCENT" && (form.discountValue < 1 || form.discountValue > 90)) {
      issue("discountValue", "เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90");
    }
    if (form.discountType === "FIXED" && form.minSpend > 0 && form.discountValue > form.minSpend) {
      issue("discountValue", `ส่วนลดต้องไม่เกินยอดขั้นต่ำ ${money(form.minSpend)}`);
    }
    if (!Number.isInteger(form.usageLimitPerUser) || form.usageLimitPerUser < 1) {
      issue("usageLimitPerUser", "สิทธิ์ต่อคนต้องเป็นจำนวนเต็มอย่างน้อย 1");
    }
    for (const key of ["usageLimitTotal", "claimLimit"] as const) {
      const value = form[key];
      if (value != null && (!Number.isInteger(value) || value < 1)) {
        issue(key, "จำนวนสิทธิ์ต้องเป็นจำนวนเต็มอย่างน้อย 1");
      }
    }
    if (!Number.isFinite(Date.parse(form.startsAt))) issue("startsAt", "กรุณาเลือกวันเริ่ม");
    if (!Number.isFinite(Date.parse(form.endsAt))) issue("endsAt", "กรุณาเลือกวันสิ้นสุด");
    else if (!existing && Date.parse(form.endsAt) <= Date.now()) {
      issue("endsAt", "วันสิ้นสุดต้องอยู่ในอนาคต");
    }
    if (Date.parse(form.endsAt) <= Date.parse(form.startsAt)) {
      issue("endsAt", "วันสิ้นสุดต้องหลังวันเริ่ม");
    }
    if (form.claimable && form.visibility !== "PUBLIC") {
      issue("claimable", "โค้ดที่ให้กดเก็บต้องเป็นสาธารณะ");
    }
    if (existing) {
      if (form.usageLimitTotal != null && form.usageLimitTotal < (existing.usedCount ?? 0)) {
        issue("usageLimitTotal", "สิทธิ์รวมต้องไม่ต่ำกว่าจำนวนที่ใช้แล้ว");
      }
      if (form.claimLimit != null && form.claimLimit < (existing.claimedCount ?? 0)) {
        issue("claimLimit", "จำนวนแจกต้องไม่ต่ำกว่าจำนวนที่เก็บแล้ว");
      }
      if ((existing.usedCount ?? 0) > 0) {
        if (Date.parse(form.endsAt) < Date.parse(existing.endsAt ?? form.endsAt)) {
          issue("endsAt", "หลังมีการใช้โค้ดแล้ว ลดวันสิ้นสุดไม่ได้");
        }
        if (form.usageLimitTotal != null &&
          (existing.usageLimitTotal == null || form.usageLimitTotal < existing.usageLimitTotal)) {
          issue("usageLimitTotal", "หลังมีการใช้โค้ดแล้ว ลดจำนวนสิทธิ์ไม่ได้");
        }
      }
      if ((existing.claimedCount ?? 0) > 0 && form.claimLimit != null &&
        (existing.claimLimit == null || form.claimLimit < existing.claimLimit)) {
        issue("claimLimit", "หลังมีผู้เก็บโค้ดแล้ว ลดจำนวนที่แจกไม่ได้");
      }
    }
  });
}

export function getSellerPromotionErrors(form: SellerPromotionInput, existing?: Partial<SellerPromotion>) {
  const result = schemaForSellerPromotion(existing).safeParse(form);
  return result.success ? {} : Object.fromEntries(
    result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
  );
}
