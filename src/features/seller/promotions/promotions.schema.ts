import { z } from "zod";
import { money } from "./promotions.format";
import type { SellerPromotion, SellerPromotionInput } from "./promotions.types";
import { translate } from "@/lib/i18n";

// @tolgee-key {"key":"seller.promotionsSchema.regex","ns":"promotions","defaultValue":"รหัสต้องเป็น A-Z หรือ 0-9 จำนวน 4–20 ตัว"}
// @tolgee-key {"key":"seller.promotionsSchema.min","ns":"promotions","defaultValue":"กรุณากรอกชื่อ"}
// @tolgee-key {"key":"seller.promotionsSchema.positive","ns":"promotions","defaultValue":"ส่วนลดต้องมากกว่า 0"}
// @tolgee-key {"key":"seller.promotionsSchema.nonnegative","ns":"promotions","defaultValue":"ยอดขั้นต่ำต้องไม่ติดลบ"}
// @tolgee-key {"key":"seller.promotionsSchema.issue","ns":"promotions","defaultValue":"เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90"}
// @tolgee-key {"key":"seller.promotionsSchema.issue2","ns":"promotions","defaultValue":"ส่วนลดต้องไม่เกินยอดขั้นต่ำ {value}"}
// @tolgee-key {"key":"seller.promotionsSchema.issue3","ns":"promotions","defaultValue":"สิทธิ์ต่อคนต้องเป็นจำนวนเต็มอย่างน้อย 1"}
// @tolgee-key {"key":"seller.promotionsSchema.issue4","ns":"promotions","defaultValue":"จำนวนสิทธิ์ต้องเป็นจำนวนเต็มอย่างน้อย 1"}
// @tolgee-key {"key":"seller.promotionsSchema.issue5","ns":"promotions","defaultValue":"กรุณาเลือกวันเริ่ม"}
// @tolgee-key {"key":"seller.promotionsSchema.issue6","ns":"promotions","defaultValue":"กรุณาเลือกวันสิ้นสุด"}
// @tolgee-key {"key":"seller.promotionsSchema.issue7","ns":"promotions","defaultValue":"วันสิ้นสุดต้องอยู่ในอนาคต"}
// @tolgee-key {"key":"seller.promotionsSchema.issue8","ns":"promotions","defaultValue":"วันสิ้นสุดต้องหลังวันเริ่ม"}
// @tolgee-key {"key":"seller.promotionsSchema.issue9","ns":"promotions","defaultValue":"โค้ดที่ให้กดเก็บต้องเป็นสาธารณะ"}
// @tolgee-key {"key":"seller.promotionsSchema.issue10","ns":"promotions","defaultValue":"สิทธิ์รวมต้องไม่ต่ำกว่าจำนวนที่ใช้แล้ว"}
// @tolgee-key {"key":"seller.promotionsSchema.issue11","ns":"promotions","defaultValue":"จำนวนแจกต้องไม่ต่ำกว่าจำนวนที่เก็บแล้ว"}
// @tolgee-key {"key":"seller.promotionsSchema.issue12","ns":"promotions","defaultValue":"หลังมีการใช้โค้ดแล้ว ลดวันสิ้นสุดไม่ได้"}
// @tolgee-key {"key":"seller.promotionsSchema.issue13","ns":"promotions","defaultValue":"หลังมีการใช้โค้ดแล้ว ลดจำนวนสิทธิ์ไม่ได้"}
// @tolgee-key {"key":"seller.promotionsSchema.issue14","ns":"promotions","defaultValue":"หลังมีผู้เก็บโค้ดแล้ว ลดจำนวนที่แจกไม่ได้"}

/** สร้างใหม่ทุกครั้งเพื่อให้ข้อความตามภาษาปัจจุบัน */
const sellerPromotionShape = () => z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/, translate("promotions", "seller.promotionsSchema.regex", "รหัสต้องเป็น A-Z หรือ 0-9 จำนวน 4–20 ตัว")),
  name: z.string().trim().min(1, translate("promotions", "seller.promotionsSchema.min", "กรุณากรอกชื่อ")),
  description: z.string().nullable(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive(translate("promotions", "seller.promotionsSchema.positive", "ส่วนลดต้องมากกว่า 0")),
  maxDiscount: z.number().nullable(),
  minSpend: z.number().nonnegative(translate("promotions", "seller.promotionsSchema.nonnegative", "ยอดขั้นต่ำต้องไม่ติดลบ")),
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
  return sellerPromotionShape().superRefine((form, context) => {
    const issue = (path: keyof SellerPromotionInput, message: string) =>
      context.addIssue({ code: "custom", path: [path], message });
    if (form.discountType === "PERCENT" && (form.discountValue < 1 || form.discountValue > 90)) {
      issue("discountValue", translate("promotions", "seller.promotionsSchema.issue", "เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90"));
    }
    if (form.discountType === "FIXED" && form.minSpend > 0 && form.discountValue > form.minSpend) {
      issue("discountValue", translate("promotions", "seller.promotionsSchema.issue2", "ส่วนลดต้องไม่เกินยอดขั้นต่ำ {value}", { value: money(form.minSpend) }));
    }
    if (!Number.isInteger(form.usageLimitPerUser) || form.usageLimitPerUser < 1) {
      issue("usageLimitPerUser", translate("promotions", "seller.promotionsSchema.issue3", "สิทธิ์ต่อคนต้องเป็นจำนวนเต็มอย่างน้อย 1"));
    }
    for (const key of ["usageLimitTotal", "claimLimit"] as const) {
      const value = form[key];
      if (value != null && (!Number.isInteger(value) || value < 1)) {
        issue(key, translate("promotions", "seller.promotionsSchema.issue4", "จำนวนสิทธิ์ต้องเป็นจำนวนเต็มอย่างน้อย 1"));
      }
    }
    if (!Number.isFinite(Date.parse(form.startsAt))) issue("startsAt", translate("promotions", "seller.promotionsSchema.issue5", "กรุณาเลือกวันเริ่ม"));
    if (!Number.isFinite(Date.parse(form.endsAt))) issue("endsAt", translate("promotions", "seller.promotionsSchema.issue6", "กรุณาเลือกวันสิ้นสุด"));
    else if (!existing && Date.parse(form.endsAt) <= Date.now()) {
      issue("endsAt", translate("promotions", "seller.promotionsSchema.issue7", "วันสิ้นสุดต้องอยู่ในอนาคต"));
    }
    if (Date.parse(form.endsAt) <= Date.parse(form.startsAt)) {
      issue("endsAt", translate("promotions", "seller.promotionsSchema.issue8", "วันสิ้นสุดต้องหลังวันเริ่ม"));
    }
    if (form.claimable && form.visibility !== "PUBLIC") {
      issue("claimable", translate("promotions", "seller.promotionsSchema.issue9", "โค้ดที่ให้กดเก็บต้องเป็นสาธารณะ"));
    }
    if (existing) {
      if (form.usageLimitTotal != null && form.usageLimitTotal < (existing.usedCount ?? 0)) {
        issue("usageLimitTotal", translate("promotions", "seller.promotionsSchema.issue10", "สิทธิ์รวมต้องไม่ต่ำกว่าจำนวนที่ใช้แล้ว"));
      }
      if (form.claimLimit != null && form.claimLimit < (existing.claimedCount ?? 0)) {
        issue("claimLimit", translate("promotions", "seller.promotionsSchema.issue11", "จำนวนแจกต้องไม่ต่ำกว่าจำนวนที่เก็บแล้ว"));
      }
      if ((existing.usedCount ?? 0) > 0) {
        if (Date.parse(form.endsAt) < Date.parse(existing.endsAt ?? form.endsAt)) {
          issue("endsAt", translate("promotions", "seller.promotionsSchema.issue12", "หลังมีการใช้โค้ดแล้ว ลดวันสิ้นสุดไม่ได้"));
        }
        if (form.usageLimitTotal != null &&
          (existing.usageLimitTotal == null || form.usageLimitTotal < existing.usageLimitTotal)) {
          issue("usageLimitTotal", translate("promotions", "seller.promotionsSchema.issue13", "หลังมีการใช้โค้ดแล้ว ลดจำนวนสิทธิ์ไม่ได้"));
        }
      }
      if ((existing.claimedCount ?? 0) > 0 && form.claimLimit != null &&
        (existing.claimLimit == null || form.claimLimit < existing.claimLimit)) {
        issue("claimLimit", translate("promotions", "seller.promotionsSchema.issue14", "หลังมีผู้เก็บโค้ดแล้ว ลดจำนวนที่แจกไม่ได้"));
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
