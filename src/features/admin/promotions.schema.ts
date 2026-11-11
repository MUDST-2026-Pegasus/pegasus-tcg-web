import { z } from "zod";

import { HOME_STRIP_MAX } from "./promotions.format";
import type { AdminPromotion, AdminPromotionInput } from "./promotions.types";
import { translate } from "@/lib/i18n";

// @tolgee-key {"key":"admin.promotionsSchema.error","ns":"promotions","defaultValue":"กรอก{label}เป็นตัวเลข"}
// @tolgee-key {"key":"admin.promotionsSchema.int","ns":"promotions","defaultValue":"{label}ต้องเป็นจำนวนเต็ม"}
// @tolgee-key {"key":"admin.promotionsSchema.regex","ns":"promotions","defaultValue":"รหัสต้องเป็น A–Z หรือ 0–9 จำนวน 4–20 ตัว"}
// @tolgee-key {"key":"admin.promotionsSchema.min","ns":"promotions","defaultValue":"กรุณากรอกชื่อแคมเปญ"}
// @tolgee-key {"key":"admin.promotionsSchema.max","ns":"promotions","defaultValue":"ไม่เกิน 60 ตัวอักษร"}
// @tolgee-key {"key":"admin.promotionsSchema.max2","ns":"promotions","defaultValue":"ไม่เกิน 500 ตัวอักษร"}
// @tolgee-key {"key":"admin.promotionsSchema.error2","ns":"promotions","defaultValue":"กรอกมูลค่าส่วนลด"}
// @tolgee-key {"key":"admin.promotionsSchema.nonnegative","ns":"promotions","defaultValue":"ต้องไม่ติดลบ"}
// @tolgee-key {"key":"admin.promotionsSchema.error3","ns":"promotions","defaultValue":"กรอกเป็นตัวเลข"}
// @tolgee-key {"key":"admin.promotionsSchema.positive","ns":"promotions","defaultValue":"ต้องมากกว่า THB 0.00"}
// @tolgee-key {"key":"admin.promotionsSchema.error4","ns":"promotions","defaultValue":"กรอกยอดขั้นต่ำ (ใส่ 0 ถ้าไม่มี)"}
// @tolgee-key {"key":"admin.promotionsSchema.count","ns":"promotions","defaultValue":"จำนวนสิทธิ์"}
// @tolgee-key {"key":"admin.promotionsSchema.min2","ns":"promotions","defaultValue":"จำนวนสิทธิ์ต้องอย่างน้อย 1"}
// @tolgee-key {"key":"admin.promotionsSchema.count2","ns":"promotions","defaultValue":"สิทธิ์ต่อคน"}
// @tolgee-key {"key":"admin.promotionsSchema.min3","ns":"promotions","defaultValue":"อย่างน้อย 1 ครั้ง"}
// @tolgee-key {"key":"admin.promotionsSchema.refine","ns":"promotions","defaultValue":"กรุณาเลือกวันเริ่ม"}
// @tolgee-key {"key":"admin.promotionsSchema.refine2","ns":"promotions","defaultValue":"กรุณาเลือกวันสิ้นสุด"}
// @tolgee-key {"key":"admin.promotionsSchema.count3","ns":"promotions","defaultValue":"จำนวนที่แจก"}
// @tolgee-key {"key":"admin.promotionsSchema.min4","ns":"promotions","defaultValue":"จำนวนที่แจกต้องอย่างน้อย 1"}
// @tolgee-key {"key":"admin.promotionsSchema.min5","ns":"promotions","defaultValue":"ลำดับบนหน้าแรกต้องอยู่ระหว่าง 1–{HOME_STRIP_MAX}"}
// @tolgee-key {"key":"admin.promotionsSchema.issue","ns":"promotions","defaultValue":"เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90"}
// @tolgee-key {"key":"admin.promotionsSchema.issue2","ns":"promotions","defaultValue":"กรุณาเลือกเกมหรือหมวดหมู่อย่างน้อยหนึ่งรายการ"}
// @tolgee-key {"key":"admin.promotionsSchema.issue3","ns":"promotions","defaultValue":"วันสิ้นสุดต้องหลังวันเริ่ม"}
// @tolgee-key {"key":"admin.promotionsSchema.issue4","ns":"promotions","defaultValue":"วันสิ้นสุดต้องอยู่ในอนาคต"}
// @tolgee-key {"key":"admin.promotionsSchema.issue5","ns":"promotions","defaultValue":"ต้องเปิดให้กดเก็บก่อน"}
// @tolgee-key {"key":"admin.promotionsSchema.issue6","ns":"promotions","defaultValue":"แสดงหน้าแรกได้เฉพาะโค้ดสาธารณะที่กดเก็บได้"}
// @tolgee-key {"key":"admin.promotionsSchema.issue7","ns":"promotions","defaultValue":"หน้าแรกมีครบ {HOME_STRIP_MAX} โค้ดแล้ว — นำโค้ดอื่นออกก่อน"}
// @tolgee-key {"key":"admin.promotionsSchema.issue8","ns":"promotions","defaultValue":"ต้องไม่ต่ำกว่าที่ใช้ไปแล้ว ({used})"}
// @tolgee-key {"key":"admin.promotionsSchema.issue9","ns":"promotions","defaultValue":"ต้องไม่ต่ำกว่าที่เก็บไปแล้ว ({claimed})"}
// @tolgee-key {"key":"admin.promotionsSchema.issue10","ns":"promotions","defaultValue":"หลังมีการใช้โค้ดแล้ว ยืดวันสิ้นสุดได้อย่างเดียว"}
// @tolgee-key {"key":"admin.promotionsSchema.issue11","ns":"promotions","defaultValue":"หลังมีการใช้โค้ดแล้ว เพิ่มจำนวนสิทธิ์ได้อย่างเดียว"}
// @tolgee-key {"key":"admin.promotionsSchema.issue12","ns":"promotions","defaultValue":"หลังมีผู้เก็บโค้ดแล้ว เปลี่ยนเงื่อนไขการเก็บไม่ได้"}
// @tolgee-key {"key":"admin.promotionsSchema.issue13","ns":"promotions","defaultValue":"หลังมีผู้เก็บโค้ดแล้ว เพิ่มจำนวนที่แจกได้อย่างเดียว"}

/**
 * ฟอร์มสร้าง/แก้โค้ด Pegasus — กติกาตั้งให้ตรงกับ `AdminPromotionService.validate`
 * และ `PromotionEditRules` ฝั่ง backend ถ้าฝั่งโน้นแก้ ต้องตามมาแก้ที่นี่
 *
 * หลังมีออเดอร์ใช้โค้ดแล้ว แก้ได้แค่ชื่อ คำอธิบาย ยืดวันสิ้นสุด เพิ่มจำนวนสิทธิ์ และการแจก (กดเก็บ)
 * หลังมีคนเก็บโค้ดแล้ว "ต้องเก็บก่อนใช้" ล็อก และจำนวนที่แจกเพิ่มได้อย่างเดียว
 */

export type PromotionFormErrors = Partial<Record<keyof AdminPromotionInput, string>>;

/** ฟิลด์ที่ล็อกทันทีที่มีออเดอร์ใช้โค้ด (ตรงกับ `requireOnlyEditableAfterUse`) */
const LOCKED_AFTER_USE = new Set<keyof AdminPromotionInput>([
  "code",
  "discountType",
  "discountValue",
  "maxDiscount",
  "minSpend",
  "scopeType",
  "scopeIds",
  "visibility",
  "newBuyerOnly",
  "usageLimitPerUser",
  "claimRequired",
  "startsAt",
]);

export type PromotionLocks = {
  used: boolean;
  claimed: boolean;
  isLocked: (field: keyof AdminPromotionInput) => boolean;
};

export function getPromotionLocks(existing?: Pick<AdminPromotion, "usedCount" | "claimedCount">): PromotionLocks {
  const used = (existing?.usedCount ?? 0) > 0;
  const claimed = (existing?.claimedCount ?? 0) > 0;
  return {
    used,
    claimed,
    isLocked: (field) => (used && LOCKED_AFTER_USE.has(field)) || (claimed && field === "claimRequired"),
  };
}

export type PromotionFormContext = {
  /** โค้ดเดิมเมื่อแก้ไข — ใช้ตรวจกติกาหลังมีคนใช้/เก็บ */
  existing?: Partial<AdminPromotion>;
  /** จำนวนโค้ดที่อยู่บนหน้าแรกตอนนี้ — ไม่รู้ก็ไม่ต้องตรวจ backend ตรวจซ้ำอยู่แล้ว */
  featuredCount?: number;
  now?: number;
};

const count = (label: string) =>
  z.number({ error: translate("promotions", "admin.promotionsSchema.error", "กรอก{label}เป็นตัวเลข", { label }) }).int(translate("promotions", "admin.promotionsSchema.int", "{label}ต้องเป็นจำนวนเต็ม", { label }));

/** สร้างใหม่ทุกครั้งเพื่อให้ข้อความตามภาษาปัจจุบัน */
const promotionShape = () => z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{4,20}$/, translate("promotions", "admin.promotionsSchema.regex", "รหัสต้องเป็น A–Z หรือ 0–9 จำนวน 4–20 ตัว")),
  name: z.string().trim().min(1, translate("promotions", "admin.promotionsSchema.min", "กรุณากรอกชื่อแคมเปญ")).max(60, translate("promotions", "admin.promotionsSchema.max", "ไม่เกิน 60 ตัวอักษร")),
  description: z.string().max(500, translate("promotions", "admin.promotionsSchema.max2", "ไม่เกิน 500 ตัวอักษร")).nullable(),
  discountType: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  discountValue: z.number({ error: translate("promotions", "admin.promotionsSchema.error2", "กรอกมูลค่าส่วนลด") }).nonnegative(translate("promotions", "admin.promotionsSchema.nonnegative", "ต้องไม่ติดลบ")),
  maxDiscount: z.number({ error: translate("promotions", "admin.promotionsSchema.error3", "กรอกเป็นตัวเลข") }).positive(translate("promotions", "admin.promotionsSchema.positive", "ต้องมากกว่า THB 0.00")).nullable(),
  minSpend: z.number({ error: translate("promotions", "admin.promotionsSchema.error4", "กรอกยอดขั้นต่ำ (ใส่ 0 ถ้าไม่มี)") }).nonnegative(translate("promotions", "admin.promotionsSchema.nonnegative", "ต้องไม่ติดลบ")),
  scopeType: z.enum(["ALL", "GAME", "CATEGORY"]),
  scopeIds: z.array(z.number()),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  newBuyerOnly: z.boolean(),
  usageLimitTotal: count(translate("promotions", "admin.promotionsSchema.count", "จำนวนสิทธิ์")).min(1, translate("promotions", "admin.promotionsSchema.min2", "จำนวนสิทธิ์ต้องอย่างน้อย 1")).nullable(),
  usageLimitPerUser: count(translate("promotions", "admin.promotionsSchema.count2", "สิทธิ์ต่อคน")).min(1, translate("promotions", "admin.promotionsSchema.min3", "อย่างน้อย 1 ครั้ง")),
  startsAt: z.string().refine((value) => Number.isFinite(Date.parse(value)), translate("promotions", "admin.promotionsSchema.refine", "กรุณาเลือกวันเริ่ม")),
  endsAt: z.string().refine((value) => Number.isFinite(Date.parse(value)), translate("promotions", "admin.promotionsSchema.refine2", "กรุณาเลือกวันสิ้นสุด")),
  claimable: z.boolean(),
  claimRequired: z.boolean(),
  claimLimit: count(translate("promotions", "admin.promotionsSchema.count3", "จำนวนที่แจก")).min(1, translate("promotions", "admin.promotionsSchema.min4", "จำนวนที่แจกต้องอย่างน้อย 1")).nullable(),
  featuredOnHome: z.boolean(),
  homeSort: z
    .number()
    .int()
    .min(0, translate("promotions", "admin.promotionsSchema.min5", "ลำดับบนหน้าแรกต้องอยู่ระหว่าง 1–{HOME_STRIP_MAX}", { HOME_STRIP_MAX }))
    .max(HOME_STRIP_MAX - 1, translate("promotions", "admin.promotionsSchema.min5", "ลำดับบนหน้าแรกต้องอยู่ระหว่าง 1–{HOME_STRIP_MAX}", { HOME_STRIP_MAX }))
    .nullable(),
});

/** zod schema factory — กติกาข้ามฟิลด์ขึ้นกับโค้ดเดิมและจำนวนโค้ดบนหน้าแรก */
export function createPromotionSchema({ existing, featuredCount, now = Date.now() }: PromotionFormContext = {}) {
  return promotionShape().superRefine((value, ctx) => {
    const issue = (path: keyof AdminPromotionInput, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (value.discountType === "PERCENT" && (value.discountValue < 1 || value.discountValue > 90)) {
      issue("discountValue", translate("promotions", "admin.promotionsSchema.issue", "เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90"));
    }
    if (value.discountType === "FIXED" && value.discountValue <= 0) {
      issue("discountValue", translate("promotions", "admin.promotionsSchema.positive", "ต้องมากกว่า THB 0.00"));
    }
    if (value.scopeType !== "ALL" && value.scopeIds.length === 0) {
      issue("scopeIds", translate("promotions", "admin.promotionsSchema.issue2", "กรุณาเลือกเกมหรือหมวดหมู่อย่างน้อยหนึ่งรายการ"));
    }

    const starts = Date.parse(value.startsAt);
    const ends = Date.parse(value.endsAt);
    if (Number.isFinite(starts) && Number.isFinite(ends) && ends <= starts) {
      issue("endsAt", translate("promotions", "admin.promotionsSchema.issue3", "วันสิ้นสุดต้องหลังวันเริ่ม"));
    } else if (!existing && Number.isFinite(ends) && ends <= now) {
      issue("endsAt", translate("promotions", "admin.promotionsSchema.issue4", "วันสิ้นสุดต้องอยู่ในอนาคต"));
    }

    if (value.claimRequired && !value.claimable) issue("claimRequired", translate("promotions", "admin.promotionsSchema.issue5", "ต้องเปิดให้กดเก็บก่อน"));
    if (value.featuredOnHome && (!value.claimable || value.visibility !== "PUBLIC")) {
      issue("featuredOnHome", translate("promotions", "admin.promotionsSchema.issue6", "แสดงหน้าแรกได้เฉพาะโค้ดสาธารณะที่กดเก็บได้"));
    }
    const newlyFeatured = value.featuredOnHome && !existing?.featuredOnHome;
    if (newlyFeatured && featuredCount != null && featuredCount >= HOME_STRIP_MAX) {
      issue("featuredOnHome", translate("promotions", "admin.promotionsSchema.issue7", "หน้าแรกมีครบ {HOME_STRIP_MAX} โค้ดแล้ว — นำโค้ดอื่นออกก่อน", { HOME_STRIP_MAX }));
    }

    const used = existing?.usedCount ?? 0;
    const claimed = existing?.claimedCount ?? 0;
    if (value.usageLimitTotal != null && value.usageLimitTotal < used) {
      issue("usageLimitTotal", translate("promotions", "admin.promotionsSchema.issue8", "ต้องไม่ต่ำกว่าที่ใช้ไปแล้ว ({used})", { used }));
    }
    if (value.claimable && value.claimLimit != null && value.claimLimit < claimed) {
      issue("claimLimit", translate("promotions", "admin.promotionsSchema.issue9", "ต้องไม่ต่ำกว่าที่เก็บไปแล้ว ({claimed})", { claimed }));
    }
    // null = ไม่จำกัด จึงไม่เคยต่ำกว่า และไม่มีตัวเลขไหนสูงกว่าไม่จำกัด
    const lowered = (before: number | null | undefined, after: number | null) =>
      after != null && (before == null || after < before);
    if (used > 0) {
      if (existing?.endsAt && Number.isFinite(ends) && ends < Date.parse(existing.endsAt)) {
        issue("endsAt", translate("promotions", "admin.promotionsSchema.issue10", "หลังมีการใช้โค้ดแล้ว ยืดวันสิ้นสุดได้อย่างเดียว"));
      }
      if (lowered(existing?.usageLimitTotal, value.usageLimitTotal)) {
        issue("usageLimitTotal", translate("promotions", "admin.promotionsSchema.issue11", "หลังมีการใช้โค้ดแล้ว เพิ่มจำนวนสิทธิ์ได้อย่างเดียว"));
      }
    }
    if (claimed > 0) {
      if (existing?.claimRequired != null && value.claimRequired !== existing.claimRequired) {
        issue("claimRequired", translate("promotions", "admin.promotionsSchema.issue12", "หลังมีผู้เก็บโค้ดแล้ว เปลี่ยนเงื่อนไขการเก็บไม่ได้"));
      }
      if (lowered(existing?.claimLimit, value.claimLimit)) {
        issue("claimLimit", translate("promotions", "admin.promotionsSchema.issue13", "หลังมีผู้เก็บโค้ดแล้ว เพิ่มจำนวนที่แจกได้อย่างเดียว"));
      }
    }
  });
}

/** ข้อความแรกของแต่ละช่อง — ว่าง = ส่งได้ */
export function getPromotionErrors(input: AdminPromotionInput, context?: PromotionFormContext): PromotionFormErrors {
  const result = createPromotionSchema(context).safeParse(input);
  if (result.success) return {};
  const errors: PromotionFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof AdminPromotionInput;
    errors[field] ??= issue.message;
  }
  return errors;
}

/**
 * ค่าที่ส่งจริง — ล้างฟิลด์ที่ไม่มีความหมายกับประเภท/การมองเห็นนั้น
 * ให้ตรงกับที่ backend เก็บ จะได้ไม่ขึ้นเป็น "เปลี่ยนแปลง" ในการแก้ครั้งถัดไป
 */
export function toPromotionPayload(input: AdminPromotionInput): AdminPromotionInput {
  const claimable = input.visibility === "PUBLIC" && input.claimable;
  const featuredOnHome = claimable && input.featuredOnHome;
  return {
    ...input,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    discountValue: input.discountType === "FREE_SHIPPING" ? 0 : input.discountValue,
    maxDiscount: input.discountType === "FIXED" ? null : input.maxDiscount,
    scopeIds: input.scopeType === "ALL" ? [] : input.scopeIds,
    claimable,
    claimRequired: claimable && input.claimRequired,
    claimLimit: claimable ? input.claimLimit : null,
    featuredOnHome,
    homeSort: featuredOnHome ? input.homeSort : null,
  };
}

const INPUT_KEYS: Array<keyof AdminPromotionInput> = [
  "code",
  "name",
  "description",
  "discountType",
  "discountValue",
  "maxDiscount",
  "minSpend",
  "scopeType",
  "scopeIds",
  "visibility",
  "newBuyerOnly",
  "usageLimitTotal",
  "usageLimitPerUser",
  "startsAt",
  "endsAt",
  "claimable",
  "claimRequired",
  "claimLimit",
  "featuredOnHome",
  "homeSort",
];

/** ค่าของฟอร์มจากโค้ดที่มีอยู่ */
export function toPromotionInput(promotion: AdminPromotion): AdminPromotionInput {
  return Object.fromEntries(INPUT_KEYS.map((key) => [key, promotion[key]])) as AdminPromotionInput;
}

/** ฟิลด์ที่ค่าใหม่ต่างจากโค้ดเดิม — เทียบหลัง `toPromotionPayload` จึงไม่นับฟิลด์ที่ถูกล้าง */
export function changedPromotionFields(existing: AdminPromotion, input: AdminPromotionInput) {
  const before = toPromotionPayload(toPromotionInput(existing));
  const after = toPromotionPayload(input);
  return INPUT_KEYS.filter((key) => {
    if (key === "startsAt" || key === "endsAt") return Date.parse(before[key]) !== Date.parse(after[key]);
    if (key === "scopeIds") return [...before.scopeIds].sort().join() !== [...after.scopeIds].sort().join();
    return JSON.stringify(before[key]) !== JSON.stringify(after[key]);
  });
}
