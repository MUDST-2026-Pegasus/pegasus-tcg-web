import { z } from "zod";

import { FLASH_MAX_HOURS, hoursBetween, saleHasOrders } from "./sales.format";
import type { AdminSale, AdminSaleInput } from "./sales.types";

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

const optionalCount = (label: string) =>
  z.number({ error: `กรอก${label}เป็นตัวเลข` }).int(`${label}ต้องเป็นจำนวนเต็ม`).min(1, `${label}ต้องอย่างน้อย 1`).nullable();

const isoDate = (label: string) => z.string().refine((value) => Number.isFinite(Date.parse(value)), `กรุณาเลือก${label}`);

const saleShape = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อแคมเปญ").max(80, "ไม่เกิน 80 ตัวอักษร"),
  slug: z
    .string()
    .trim()
    .min(3, "ลิงก์ต้องยาวอย่างน้อย 3 ตัว")
    .max(60, "ไม่เกิน 60 ตัว")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ใช้ได้เฉพาะ a–z 0–9 และ - (ห้ามขึ้นต้น/ลงท้ายด้วย -)"),
  saleType: z.enum(["FLASH_SALE", "CATEGORY_SALE"]),
  discountType: z.enum(["PERCENT", "FIXED_OFF"]),
  discountValue: z.number({ error: "กรอกส่วนลด" }).nullable(),
  maxDiscountPerUnit: z.number({ error: "กรอกเป็นตัวเลข" }).positive("ต้องมากกว่า ฿0").nullable(),
  scopeType: z.enum(["ALL", "GAME", "CATEGORY", "CARD_SET"]),
  scopeIds: z.array(z.number()),
  conditions: z.array(z.string()),
  minUnitPrice: z.number({ error: "กรอกเป็นตัวเลข" }).nonnegative("ต้องไม่ติดลบ").nullable(),
  excludedSellerIds: z.array(z.number()),
  perListingQuota: optionalCount("โควตาต่อ listing"),
  perBuyerLimit: optionalCount("จำกัดต่อผู้ซื้อ"),
  budgetCap: z.number({ error: "กรอกเป็นตัวเลข" }).positive("งบต้องมากกว่า ฿0").nullable(),
  bannerImageUrl: z.string().nullable(),
  featuredOnHome: z.boolean(),
  homeSort: z.number().int().min(0, "ลำดับต้องไม่ติดลบ").nullable(),
  startsAt: isoDate("วันเริ่ม"),
  endsAt: isoDate("วันสิ้นสุด"),
});

/** zod schema factory — กติกาข้ามฟิลด์ขึ้นกับแคมเปญเดิม */
export function createSaleSchema({ existing, now = Date.now() }: SaleFormContext = {}) {
  const locks = getSaleLocks({ soldUnits: existing?.soldUnits ?? 0 });
  return saleShape.superRefine((value, ctx) => {
    const issue = (path: keyof AdminSaleInput, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    const discount = value.discountValue;
    if (discount == null) {
      issue("discountValue", "กรอกส่วนลด");
    } else if (value.discountType === "PERCENT" && (discount < 1 || discount > 90 || !Number.isInteger(discount))) {
      issue("discountValue", "เปอร์เซ็นต์ต้องเป็นจำนวนเต็ม 1–90");
    } else if (value.discountType === "FIXED_OFF" && discount <= 0) {
      issue("discountValue", "ต้องมากกว่า ฿0");
    }

    if (value.scopeType !== "ALL" && value.scopeIds.length === 0) {
      issue("scopeIds", "เลือกอย่างน้อยหนึ่งรายการ");
    }

    const starts = Date.parse(value.startsAt);
    const ends = Date.parse(value.endsAt);
    if (Number.isFinite(starts) && Number.isFinite(ends)) {
      if (ends <= starts) {
        issue("endsAt", "วันสิ้นสุดต้องหลังวันเริ่ม");
      } else if (value.saleType === "FLASH_SALE" && hoursBetween(value.startsAt, value.endsAt) > FLASH_MAX_HOURS) {
        issue("endsAt", `Flash Sale ยาวได้ไม่เกิน ${FLASH_MAX_HOURS} ชั่วโมง`);
      } else if (!existing && ends <= now) {
        issue("endsAt", "วันสิ้นสุดต้องอยู่ในอนาคต");
      }
    }

    if (value.saleType === "FLASH_SALE" && value.perListingQuota == null) {
      issue("perListingQuota", "Flash Sale ต้องกำหนดโควตาต่อ listing");
    }

    if (locks.hasOrders && existing) {
      if (existing.budgetCap != null && (value.budgetCap == null ? false : value.budgetCap < existing.budgetCap)) {
        issue("budgetCap", "หลังมีออเดอร์ งบเพิ่มได้อย่างเดียว");
      }
      if (existing.budgetCap == null && value.budgetCap != null) {
        issue("budgetCap", "แคมเปญนี้ไม่จำกัดงบ — หลังมีออเดอร์ตั้งงบเพิ่มไม่ได้");
      }
      if (
        existing.perListingQuota != null &&
        value.perListingQuota != null &&
        value.perListingQuota < existing.perListingQuota
      ) {
        issue("perListingQuota", "หลังมีออเดอร์ โควตาเพิ่มได้อย่างเดียว");
      }
    }
    if (value.budgetCap != null && existing?.subsidyReserved != null && value.budgetCap < existing.subsidyReserved) {
      issue("budgetCap", "งบต้องไม่น้อยกว่ายอดที่อุดหนุนไปแล้ว");
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
