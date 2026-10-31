import { z } from "zod";

import { HOME_STRIP_MAX } from "./promotions.format";
import type { AdminPromotion, AdminPromotionInput } from "./promotions.types";

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
  z.number({ error: `กรอก${label}เป็นตัวเลข` }).int(`${label}ต้องเป็นจำนวนเต็ม`);

const promotionShape = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{4,20}$/, "รหัสต้องเป็น A–Z หรือ 0–9 จำนวน 4–20 ตัว"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อแคมเปญ").max(60, "ไม่เกิน 60 ตัวอักษร"),
  description: z.string().max(500, "ไม่เกิน 500 ตัวอักษร").nullable(),
  discountType: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  discountValue: z.number({ error: "กรอกมูลค่าส่วนลด" }).nonnegative("ต้องไม่ติดลบ"),
  maxDiscount: z.number({ error: "กรอกเป็นตัวเลข" }).positive("ต้องมากกว่า ฿0").nullable(),
  minSpend: z.number({ error: "กรอกยอดขั้นต่ำ (ใส่ 0 ถ้าไม่มี)" }).nonnegative("ต้องไม่ติดลบ"),
  scopeType: z.enum(["ALL", "GAME", "CATEGORY"]),
  scopeIds: z.array(z.number()),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  newBuyerOnly: z.boolean(),
  usageLimitTotal: count("จำนวนสิทธิ์").min(1, "จำนวนสิทธิ์ต้องอย่างน้อย 1").nullable(),
  usageLimitPerUser: count("สิทธิ์ต่อคน").min(1, "อย่างน้อย 1 ครั้ง"),
  startsAt: z.string().refine((value) => Number.isFinite(Date.parse(value)), "กรุณาเลือกวันเริ่ม"),
  endsAt: z.string().refine((value) => Number.isFinite(Date.parse(value)), "กรุณาเลือกวันสิ้นสุด"),
  claimable: z.boolean(),
  claimRequired: z.boolean(),
  claimLimit: count("จำนวนที่แจก").min(1, "จำนวนที่แจกต้องอย่างน้อย 1").nullable(),
  featuredOnHome: z.boolean(),
  homeSort: z
    .number()
    .int()
    .min(0, `ลำดับบนหน้าแรกต้องอยู่ระหว่าง 1–${HOME_STRIP_MAX}`)
    .max(HOME_STRIP_MAX - 1, `ลำดับบนหน้าแรกต้องอยู่ระหว่าง 1–${HOME_STRIP_MAX}`)
    .nullable(),
});

/** zod schema factory — กติกาข้ามฟิลด์ขึ้นกับโค้ดเดิมและจำนวนโค้ดบนหน้าแรก */
export function createPromotionSchema({ existing, featuredCount, now = Date.now() }: PromotionFormContext = {}) {
  return promotionShape.superRefine((value, ctx) => {
    const issue = (path: keyof AdminPromotionInput, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (value.discountType === "PERCENT" && (value.discountValue < 1 || value.discountValue > 90)) {
      issue("discountValue", "เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90");
    }
    if (value.discountType === "FIXED" && value.discountValue <= 0) {
      issue("discountValue", "ต้องมากกว่า ฿0");
    }
    if (value.scopeType !== "ALL" && value.scopeIds.length === 0) {
      issue("scopeIds", "กรุณาเลือกเกมหรือหมวดหมู่อย่างน้อยหนึ่งรายการ");
    }

    const starts = Date.parse(value.startsAt);
    const ends = Date.parse(value.endsAt);
    if (Number.isFinite(starts) && Number.isFinite(ends) && ends <= starts) {
      issue("endsAt", "วันสิ้นสุดต้องหลังวันเริ่ม");
    } else if (!existing && Number.isFinite(ends) && ends <= now) {
      issue("endsAt", "วันสิ้นสุดต้องอยู่ในอนาคต");
    }

    if (value.claimRequired && !value.claimable) issue("claimRequired", "ต้องเปิดให้กดเก็บก่อน");
    if (value.featuredOnHome && (!value.claimable || value.visibility !== "PUBLIC")) {
      issue("featuredOnHome", "แสดงหน้าแรกได้เฉพาะโค้ดสาธารณะที่กดเก็บได้");
    }
    const newlyFeatured = value.featuredOnHome && !existing?.featuredOnHome;
    if (newlyFeatured && featuredCount != null && featuredCount >= HOME_STRIP_MAX) {
      issue("featuredOnHome", `หน้าแรกมีครบ ${HOME_STRIP_MAX} โค้ดแล้ว — นำโค้ดอื่นออกก่อน`);
    }

    const used = existing?.usedCount ?? 0;
    const claimed = existing?.claimedCount ?? 0;
    if (value.usageLimitTotal != null && value.usageLimitTotal < used) {
      issue("usageLimitTotal", `ต้องไม่ต่ำกว่าที่ใช้ไปแล้ว (${used})`);
    }
    if (value.claimable && value.claimLimit != null && value.claimLimit < claimed) {
      issue("claimLimit", `ต้องไม่ต่ำกว่าที่เก็บไปแล้ว (${claimed})`);
    }
    // null = ไม่จำกัด จึงไม่เคยต่ำกว่า และไม่มีตัวเลขไหนสูงกว่าไม่จำกัด
    const lowered = (before: number | null | undefined, after: number | null) =>
      after != null && (before == null || after < before);
    if (used > 0) {
      if (existing?.endsAt && Number.isFinite(ends) && ends < Date.parse(existing.endsAt)) {
        issue("endsAt", "หลังมีการใช้โค้ดแล้ว ยืดวันสิ้นสุดได้อย่างเดียว");
      }
      if (lowered(existing?.usageLimitTotal, value.usageLimitTotal)) {
        issue("usageLimitTotal", "หลังมีการใช้โค้ดแล้ว เพิ่มจำนวนสิทธิ์ได้อย่างเดียว");
      }
    }
    if (claimed > 0) {
      if (existing?.claimRequired != null && value.claimRequired !== existing.claimRequired) {
        issue("claimRequired", "หลังมีผู้เก็บโค้ดแล้ว เปลี่ยนเงื่อนไขการเก็บไม่ได้");
      }
      if (lowered(existing?.claimLimit, value.claimLimit)) {
        issue("claimLimit", "หลังมีผู้เก็บโค้ดแล้ว เพิ่มจำนวนที่แจกได้อย่างเดียว");
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
