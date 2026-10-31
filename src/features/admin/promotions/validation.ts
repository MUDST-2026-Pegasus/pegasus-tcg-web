import { z } from "zod";
import type { AdminPromotion, AdminPromotionInput } from "./types";

const promotionFormSchema = z.object({ code: z.string().regex(/^[A-Z0-9]{4,20}$/, "รหัสต้องเป็น A-Z หรือ 0-9 จำนวน 4–20 ตัว"), name: z.string().min(1, "กรุณากรอกชื่อ"), discountType: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]), discountValue: z.number().nonnegative(), minSpend: z.number().nonnegative(), startsAt: z.string(), endsAt: z.string(), usageLimitPerUser: z.number().min(1), usageLimitTotal: z.number().nullable(), claimLimit: z.number().nullable() }).superRefine((value, context) => { if (value.discountType === "PERCENT" && (value.discountValue < 1 || value.discountValue > 90)) context.addIssue({ code: "custom", path: ["discountValue"], message: "เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90" }); if (new Date(value.endsAt) <= new Date(value.startsAt)) context.addIssue({ code: "custom", path: ["endsAt"], message: "วันสิ้นสุดต้องหลังวันเริ่ม" }); });

export function getAdminPromotionErrors(form: AdminPromotionInput, existing?: Partial<AdminPromotion>): Record<string, string> {
  const result = promotionFormSchema.safeParse(form);
  const errors: Record<string, string> = {};
  if (!result.success) for (const issue of result.error.issues) errors[String(issue.path[0])] = issue.message;
  if (form.usageLimitTotal != null && form.usageLimitTotal < (existing?.usedCount || 1)) errors.usageLimitTotal = "สิทธิ์รวมต้องไม่ต่ำกว่าจำนวนที่ใช้แล้ว";
  if (form.claimable && form.claimLimit != null && form.claimLimit < (existing?.claimedCount || 1)) errors.claimLimit = "จำนวนแจกต้องไม่ต่ำกว่าจำนวนที่เก็บแล้ว";
  if (form.claimRequired && !form.claimable) errors.claimRequired = "ต้องเปิดให้กดเก็บก่อน";
  if ((existing?.usedCount || 0) > 0) {
    if (existing?.endsAt && Date.parse(form.endsAt) < Date.parse(existing.endsAt)) errors.endsAt = "หลังมีการใช้โค้ดแล้ว ลดวันสิ้นสุดไม่ได้";
    if (form.usageLimitTotal != null && (existing?.usageLimitTotal == null || form.usageLimitTotal < existing.usageLimitTotal)) errors.usageLimitTotal = "หลังมีการใช้โค้ดแล้ว ลดจำนวนสิทธิ์ไม่ได้";
  }
  if ((existing?.claimedCount || 0) > 0) {
    if (existing?.claimRequired != null && form.claimRequired !== existing.claimRequired) errors.claimRequired = "หลังมีผู้เก็บโค้ดแล้ว เปลี่ยนเงื่อนไขการเก็บไม่ได้";
    if (form.claimLimit != null && (existing?.claimLimit == null || form.claimLimit < existing.claimLimit)) errors.claimLimit = "หลังมีผู้เก็บโค้ดแล้ว ลดจำนวนที่แจกไม่ได้";
  }
  if (!Number.isFinite(Date.parse(form.startsAt))) errors.startsAt = "กรุณาเลือกวันเริ่ม";
  if (!Number.isFinite(Date.parse(form.endsAt))) errors.endsAt = "กรุณาเลือกวันสิ้นสุด";
  else if (!existing && Date.parse(form.endsAt) <= Date.now()) errors.endsAt = "วันสิ้นสุดต้องอยู่ในอนาคต";
  return errors;
}
