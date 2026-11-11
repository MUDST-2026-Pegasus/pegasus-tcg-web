import { z } from "zod";

import { FLASH_MAX_HOURS, hoursBetween, saleHasOrders } from "./sales.format";
import type { AdminSale, AdminSaleInput } from "./sales.types";
import { translate } from "@/lib/i18n";

/**
 * ฟอร์มสร้าง/แก้แคมเปญลดราคา (Figma SAL-A2) — กติกาตาม SAL-01/02 (TCG-676/677):
 * slug a–z 0–9 และ -, PERCENT 1–90, ends_at > starts_at, Flash Sale ≤ 72 ชม.
 *
 * หลังมีออเดอร์แล้ว แก้ได้แค่ชื่อ, วันจบ, งบ (เพิ่ม), โควตา (เพิ่ม) — นอกนั้น backend ตอบ `SALE_INVALID`
 */

export type SaleFormErrors = Partial<Record<keyof AdminSaleInput, string>>;

/** ฟิลด์ที่ยังแก้ได้หลังมีออเดอร์ */
const EDITABLE_AFTER_ORDERS = new Set<keyof AdminSaleInput>(["name", "endsAt", "budgetCap", "perListingQuota"]);

export type SaleLocks = {
  /** แคมเปญมีออเดอร์แล้ว */
  hasOrders: boolean;
  isLocked: (field: keyof AdminSaleInput) => boolean;
};

export function getSaleLocks(existing?: Pick<AdminSale, "soldUnits">): SaleLocks {
  const hasOrders = existing ? saleHasOrders(existing) : false;
  return { hasOrders, isLocked: (field) => hasOrders && !EDITABLE_AFTER_ORDERS.has(field) };
}

export type SaleFormContext = {
  /** แคมเปญเดิมเมื่อแก้ไข — ใช้ตรวจกติกาหลังมีออเดอร์ */
  existing?: Partial<AdminSale>;
  now?: number;
};

// label เป็น getter เพราะ schema สร้างตอนโหลด module แต่ข้อความต้องแปลตอน validate
const optionalCount = (label: () => string) =>
  z
    .number({ error: () => translate("sale", "admin.validation.countNumber", "กรอก{label}เป็นตัวเลข", { label: label() }) })
    .int({ error: () => translate("sale", "admin.validation.countInt", "{label}ต้องเป็นจำนวนเต็ม", { label: label() }) })
    .min(1, { error: () => translate("sale", "admin.validation.countMin", "{label}ต้องอย่างน้อย {min}", { label: label(), min: 1 }) })
    .nullable();

const isoDate = (label: () => string) =>
  z.string().refine((value) => Number.isFinite(Date.parse(value)), { error: () => translate("sale", "admin.validation.dateRequired", "กรุณาเลือก{label}", { label: label() }) });

const saleShape = z.object({
  name: z.string().trim().min(1, { error: () => translate("sale", "admin.validation.nameRequired", "กรุณากรอกชื่อแคมเปญ") }).max(80, { error: () => translate("sale", "admin.validation.maxChars", "ไม่เกิน {max} ตัวอักษร", { max: 80 }) }),
  slug: z
    .string()
    .trim()
    .min(3, { error: () => translate("sale", "admin.validation.slugMin", "ลิงก์ต้องยาวอย่างน้อย {min} ตัว", { min: 3 }) })
    .max(60, { error: () => translate("sale", "admin.validation.slugMax", "ไม่เกิน {max} ตัว", { max: 60 }) })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: () => translate("sale", "admin.validation.slugFormat", "ใช้ได้เฉพาะ a–z 0–9 และ - (ห้ามขึ้นต้น/ลงท้ายด้วย -)") }),
  saleType: z.enum(["FLASH_SALE", "CATEGORY_SALE"]),
  discountType: z.enum(["PERCENT", "FIXED_OFF"]),
  discountValue: z.number({ error: () => translate("sale", "admin.validation.discountRequired", "กรอกส่วนลด") }).nullable(),
  maxDiscountPerUnit: z.number({ error: () => translate("sale", "admin.validation.number", "กรอกเป็นตัวเลข") }).positive({ error: () => translate("sale", "admin.validation.positive", "ต้องมากกว่า THB 0.00") }).nullable(),
  scopeType: z.enum(["ALL", "GAME", "CATEGORY", "CARD_SET"]),
  scopeIds: z.array(z.number()),
  conditions: z.array(z.string()),
  minUnitPrice: z.number({ error: () => translate("sale", "admin.validation.number", "กรอกเป็นตัวเลข") }).nonnegative({ error: () => translate("sale", "admin.validation.nonNegative", "ต้องไม่ติดลบ") }).nullable(),
  excludedSellerIds: z.array(z.number()),
  perListingQuota: optionalCount(() => translate("sale", "admin.field.perListingQuota", "โควตาต่อ listing")),
  perBuyerLimit: optionalCount(() => translate("sale", "admin.field.perBuyerLimit", "จำกัดต่อผู้ซื้อ")),
  budgetCap: z.number({ error: () => translate("sale", "admin.validation.number", "กรอกเป็นตัวเลข") }).positive({ error: () => translate("sale", "admin.validation.budgetPositive", "งบต้องมากกว่า THB 0.00") }).nullable(),
  bannerImageUrl: z.string().nullable(),
  featuredOnHome: z.boolean(),
  homeSort: z.number().int().min(0, { error: () => translate("sale", "admin.validation.sortNonNegative", "ลำดับต้องไม่ติดลบ") }).nullable(),
  startsAt: isoDate(() => translate("sale", "admin.field.startsAt", "วันเริ่ม")),
  endsAt: isoDate(() => translate("sale", "admin.field.endsAt", "วันสิ้นสุด")),
});

/** zod schema factory — กติกาข้ามฟิลด์ขึ้นกับแคมเปญเดิม */
export function createSaleSchema({ existing, now = Date.now() }: SaleFormContext = {}) {
  const locks = getSaleLocks({ soldUnits: existing?.soldUnits ?? 0 });
  return saleShape.superRefine((value, ctx) => {
    const issue = (path: keyof AdminSaleInput, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    const discount = value.discountValue;
    if (discount == null) {
      issue("discountValue", translate("sale", "admin.validation.discountRequired", "กรอกส่วนลด"));
    } else if (value.discountType === "PERCENT" && (discount < 1 || discount > 90 || !Number.isInteger(discount))) {
      issue("discountValue", translate("sale", "admin.validation.percentRange", "เปอร์เซ็นต์ต้องเป็นจำนวนเต็ม {min}–{max}", { min: 1, max: 90 }));
    } else if (value.discountType === "FIXED_OFF" && discount <= 0) {
      issue("discountValue", translate("sale", "admin.validation.positive", "ต้องมากกว่า THB 0.00"));
    }

    if (value.scopeType !== "ALL" && value.scopeIds.length === 0) {
      issue("scopeIds", translate("sale", "admin.validation.scopeRequired", "เลือกอย่างน้อยหนึ่งรายการ"));
    }

    const starts = Date.parse(value.startsAt);
    const ends = Date.parse(value.endsAt);
    if (Number.isFinite(starts) && Number.isFinite(ends)) {
      if (ends <= starts) {
        issue("endsAt", translate("sale", "admin.validation.endBeforeStart", "วันสิ้นสุดต้องหลังวันเริ่ม"));
      } else if (value.saleType === "FLASH_SALE" && hoursBetween(value.startsAt, value.endsAt) > FLASH_MAX_HOURS) {
        issue("endsAt", translate("sale", "admin.validation.flashMaxHours", "Flash Sale ยาวได้ไม่เกิน {hours} ชั่วโมง", { hours: FLASH_MAX_HOURS }));
      } else if (!existing && ends <= now) {
        issue("endsAt", translate("sale", "admin.validation.endInFuture", "วันสิ้นสุดต้องอยู่ในอนาคต"));
      }
    }

    if (value.saleType === "FLASH_SALE" && value.perListingQuota == null) {
      issue("perListingQuota", translate("sale", "admin.validation.flashQuotaRequired", "Flash Sale ต้องกำหนดโควตาต่อ listing"));
    }

    if (locks.hasOrders && existing) {
      if (existing.budgetCap != null && (value.budgetCap == null ? false : value.budgetCap < existing.budgetCap)) {
        issue("budgetCap", translate("sale", "admin.validation.budgetIncreaseOnly", "หลังมีออเดอร์ งบเพิ่มได้อย่างเดียว"));
      }
      if (existing.budgetCap == null && value.budgetCap != null) {
        issue("budgetCap", translate("sale", "admin.validation.budgetUnlimited", "แคมเปญนี้ไม่จำกัดงบ — หลังมีออเดอร์ตั้งงบเพิ่มไม่ได้"));
      }
      if (
        existing.perListingQuota != null &&
        value.perListingQuota != null &&
        value.perListingQuota < existing.perListingQuota
      ) {
        issue("perListingQuota", translate("sale", "admin.validation.quotaIncreaseOnly", "หลังมีออเดอร์ โควตาเพิ่มได้อย่างเดียว"));
      }
    }
    if (value.budgetCap != null && existing?.subsidyReserved != null && value.budgetCap < existing.subsidyReserved) {
      issue("budgetCap", translate("sale", "admin.validation.budgetBelowUsed", "งบต้องไม่น้อยกว่ายอดที่อุดหนุนไปแล้ว"));
    }
  });
}

/** error ทีละฟิลด์ (ข้อความแรกของแต่ละฟิลด์) — `{}` = ผ่าน */
export function getSaleErrors(input: AdminSaleInput, context: SaleFormContext = {}): SaleFormErrors {
  const result = createSaleSchema(context).safeParse(input);
  if (result.success) return {};
  const errors: SaleFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof AdminSaleInput;
    errors[key] ??= issue.message;
  }
  return errors;
}

/** แคมเปญเดิม → ค่าในฟอร์ม */
export function toSaleInput(sale: AdminSale): AdminSaleInput {
  return {
    name: sale.name,
    slug: sale.slug ?? "",
    saleType: sale.saleType === "FLASH_SALE" ? "FLASH_SALE" : "CATEGORY_SALE",
    discountType: sale.discountType === "FIXED_OFF" ? "FIXED_OFF" : "PERCENT",
    discountValue: sale.discountValue,
    maxDiscountPerUnit: sale.maxDiscountPerUnit,
    scopeType: sale.scopeType === "GAME" || sale.scopeType === "CATEGORY" || sale.scopeType === "CARD_SET" ? sale.scopeType : "ALL",
    scopeIds: [...sale.scopeIds],
    conditions: [...sale.conditions],
    minUnitPrice: sale.minUnitPrice,
    excludedSellerIds: [...sale.excludedSellerIds],
    perListingQuota: sale.perListingQuota,
    perBuyerLimit: sale.perBuyerLimit,
    budgetCap: sale.budgetCap,
    bannerImageUrl: sale.bannerImageUrl,
    featuredOnHome: sale.featuredOnHome,
    homeSort: sale.homeSort,
    startsAt: sale.startsAt,
    endsAt: sale.endsAt,
  };
}

/** ค่าในฟอร์ม → body ที่ส่ง: ตัดช่องว่าง ล้างฟิลด์ที่ไม่ใช้กับประเภท/ขอบเขตนั้น */
export function toSalePayload(input: AdminSaleInput): AdminSaleInput {
  const flash = input.saleType === "FLASH_SALE";
  return {
    ...input,
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    maxDiscountPerUnit: input.discountType === "PERCENT" ? input.maxDiscountPerUnit : null,
    scopeIds: input.scopeType === "ALL" ? [] : input.scopeIds,
    perListingQuota: flash ? input.perListingQuota : null,
    perBuyerLimit: flash ? input.perBuyerLimit : null,
    homeSort: input.featuredOnHome && !flash ? input.homeSort : null,
  };
}

/** สร้าง slug จากชื่อ: "11.11 Flash Sale" → "1111-flash-sale" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-744]
// @tolgee-key {"key": "admin.validation.countNumber", "ns": "sale", "defaultValue": "กรอก{label}เป็นตัวเลข"}
// @tolgee-key {"key": "admin.validation.countInt", "ns": "sale", "defaultValue": "{label}ต้องเป็นจำนวนเต็ม"}
// @tolgee-key {"key": "admin.validation.countMin", "ns": "sale", "defaultValue": "{label}ต้องอย่างน้อย {min}"}
// @tolgee-key {"key": "admin.validation.dateRequired", "ns": "sale", "defaultValue": "กรุณาเลือก{label}"}
// @tolgee-key {"key": "admin.validation.nameRequired", "ns": "sale", "defaultValue": "กรุณากรอกชื่อแคมเปญ"}
// @tolgee-key {"key": "admin.validation.maxChars", "ns": "sale", "defaultValue": "ไม่เกิน {max} ตัวอักษร"}
// @tolgee-key {"key": "admin.validation.slugMin", "ns": "sale", "defaultValue": "ลิงก์ต้องยาวอย่างน้อย {min} ตัว"}
// @tolgee-key {"key": "admin.validation.slugMax", "ns": "sale", "defaultValue": "ไม่เกิน {max} ตัว"}
// @tolgee-key {"key": "admin.validation.slugFormat", "ns": "sale", "defaultValue": "ใช้ได้เฉพาะ a–z 0–9 และ - (ห้ามขึ้นต้น/ลงท้ายด้วย -)"}
// @tolgee-key {"key": "admin.validation.discountRequired", "ns": "sale", "defaultValue": "กรอกส่วนลด"}
// @tolgee-key {"key": "admin.validation.number", "ns": "sale", "defaultValue": "กรอกเป็นตัวเลข"}
// @tolgee-key {"key": "admin.validation.positive", "ns": "sale", "defaultValue": "ต้องมากกว่า THB 0.00"}
// @tolgee-key {"key": "admin.validation.nonNegative", "ns": "sale", "defaultValue": "ต้องไม่ติดลบ"}
// @tolgee-key {"key": "admin.field.perListingQuota", "ns": "sale", "defaultValue": "โควตาต่อ listing"}
// @tolgee-key {"key": "admin.field.perBuyerLimit", "ns": "sale", "defaultValue": "จำกัดต่อผู้ซื้อ"}
// @tolgee-key {"key": "admin.validation.budgetPositive", "ns": "sale", "defaultValue": "งบต้องมากกว่า THB 0.00"}
// @tolgee-key {"key": "admin.validation.sortNonNegative", "ns": "sale", "defaultValue": "ลำดับต้องไม่ติดลบ"}
// @tolgee-key {"key": "admin.field.startsAt", "ns": "sale", "defaultValue": "วันเริ่ม"}
// @tolgee-key {"key": "admin.field.endsAt", "ns": "sale", "defaultValue": "วันสิ้นสุด"}
// @tolgee-key {"key": "admin.validation.percentRange", "ns": "sale", "defaultValue": "เปอร์เซ็นต์ต้องเป็นจำนวนเต็ม {min}–{max}"}
// @tolgee-key {"key": "admin.validation.scopeRequired", "ns": "sale", "defaultValue": "เลือกอย่างน้อยหนึ่งรายการ"}
// @tolgee-key {"key": "admin.validation.endBeforeStart", "ns": "sale", "defaultValue": "วันสิ้นสุดต้องหลังวันเริ่ม"}
// @tolgee-key {"key": "admin.validation.flashMaxHours", "ns": "sale", "defaultValue": "Flash Sale ยาวได้ไม่เกิน {hours} ชั่วโมง"}
// @tolgee-key {"key": "admin.validation.endInFuture", "ns": "sale", "defaultValue": "วันสิ้นสุดต้องอยู่ในอนาคต"}
// @tolgee-key {"key": "admin.validation.flashQuotaRequired", "ns": "sale", "defaultValue": "Flash Sale ต้องกำหนดโควตาต่อ listing"}
// @tolgee-key {"key": "admin.validation.budgetIncreaseOnly", "ns": "sale", "defaultValue": "หลังมีออเดอร์ งบเพิ่มได้อย่างเดียว"}
// @tolgee-key {"key": "admin.validation.budgetUnlimited", "ns": "sale", "defaultValue": "แคมเปญนี้ไม่จำกัดงบ — หลังมีออเดอร์ตั้งงบเพิ่มไม่ได้"}
// @tolgee-key {"key": "admin.validation.quotaIncreaseOnly", "ns": "sale", "defaultValue": "หลังมีออเดอร์ โควตาเพิ่มได้อย่างเดียว"}
// @tolgee-key {"key": "admin.validation.budgetBelowUsed", "ns": "sale", "defaultValue": "งบต้องไม่น้อยกว่ายอดที่อุดหนุนไปแล้ว"}
