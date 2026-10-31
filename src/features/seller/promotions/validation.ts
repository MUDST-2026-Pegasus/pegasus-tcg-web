import { z } from "zod";
import type { SellerPromotion, SellerPromotionInput } from "./types";

const schema = z.object({ code: z.string().regex(/^[A-Z0-9]{4,20}$/, "รหัสต้องเป็น A-Z หรือ 0-9 จำนวน 4–20 ตัว"), name: z.string().min(1, "กรุณากรอกชื่อ"), discountValue: z.number().positive("ส่วนลดต้องมากกว่า 0"), minSpend: z.number().nonnegative(), usageLimitPerUser: z.number().min(1), startsAt: z.string(), endsAt: z.string() });

export function getSellerPromotionErrors(form: SellerPromotionInput, existing?: Partial<SellerPromotion>): Record<string, string> {
  const result = schema.safeParse(form);
  const issues: Record<string, string> = {};
  if (!result.success) result.error.issues.forEach((issue) => { issues[String(issue.path[0])] = issue.message; });
  if (form.discountType === "PERCENT" && (form.discountValue < 1 || form.discountValue > 90)) issues.discountValue = "เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90";
  if (form.discountType === "FIXED" && form.discountValue > form.minSpend) issues.discountValue = "ส่วนลดต้องไม่เกินยอดขั้นต่ำ";
  if (new Date(form.endsAt) <= new Date(form.startsAt)) issues.endsAt = "วันสิ้นสุดต้องหลังวันเริ่ม";
  if (form.usageLimitTotal != null && form.usageLimitTotal < (existing?.usedCount || 1)) issues.usageLimitTotal = "สิทธิ์รวมต้องไม่ต่ำกว่าจำนวนที่ใช้แล้ว";
  if (form.claimLimit != null && form.claimLimit < (existing?.claimedCount || 1)) issues.claimLimit = "จำนวนแจกต้องไม่ต่ำกว่าจำนวนที่เก็บแล้ว";
  if (form.claimable && form.visibility !== "PUBLIC") issues.claimable = "โค้ดที่ให้กดเก็บต้องเป็นสาธารณะ";
  if ((existing?.usedCount || 0) > 0) {
    if (existing?.endsAt && Date.parse(form.endsAt) < Date.parse(existing.endsAt)) issues.endsAt = "หลังมีการใช้โค้ดแล้ว ลดวันสิ้นสุดไม่ได้";
    if (form.usageLimitTotal != null && (existing?.usageLimitTotal == null || form.usageLimitTotal < existing.usageLimitTotal)) issues.usageLimitTotal = "หลังมีการใช้โค้ดแล้ว ลดจำนวนสิทธิ์ไม่ได้";
  }
  if ((existing?.claimedCount || 0) > 0 && form.claimLimit != null && (existing?.claimLimit == null || form.claimLimit < existing.claimLimit)) issues.claimLimit = "หลังมีผู้เก็บโค้ดแล้ว ลดจำนวนที่แจกไม่ได้";
  if (!Number.isFinite(Date.parse(form.startsAt))) issues.startsAt = "กรุณาเลือกวันเริ่ม";
  if (!Number.isFinite(Date.parse(form.endsAt))) issues.endsAt = "กรุณาเลือกวันสิ้นสุด";
  else if (!existing && Date.parse(form.endsAt) <= Date.now()) issues.endsAt = "วันสิ้นสุดต้องอยู่ในอนาคต";
  return issues;
}
