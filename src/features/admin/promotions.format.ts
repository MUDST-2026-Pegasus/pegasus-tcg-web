import { hasErrorCode } from "@/lib/api";

import type {
  AdminPromotion,
  AdminPromotionInput,
  PromotionParty,
  PromotionStatus,
  RedemptionStatus,
} from "./promotions.types";
import { dateTimeFormat, intlLocale, translate, formatMoney } from "@/lib/i18n";

// @tolgee-key {"key":"admin.promotionsFormat.label","ns":"promotions","defaultValue":"ทั้งหมด"}
// @tolgee-key {"key":"admin.promotionsFormat.label2","ns":"promotions","defaultValue":"ใช้งานอยู่"}
// @tolgee-key {"key":"admin.promotionsFormat.label3","ns":"promotions","defaultValue":"ตั้งเวลาไว้"}
// @tolgee-key {"key":"admin.promotionsFormat.label4","ns":"promotions","defaultValue":"หยุดชั่วคราว"}
// @tolgee-key {"key":"admin.promotionsFormat.label5","ns":"promotions","defaultValue":"หมดอายุ"}
// @tolgee-key {"key":"admin.promotionsFormat.USEDUP","ns":"promotions","defaultValue":"สิทธิ์เต็ม"}
// @tolgee-key {"key":"admin.promotionsFormat.CONSUMED","ns":"promotions","defaultValue":"ใช้แล้ว"}
// @tolgee-key {"key":"admin.promotionsFormat.RESERVED","ns":"promotions","defaultValue":"จองไว้"}
// @tolgee-key {"key":"admin.promotionsFormat.RELEASED","ns":"promotions","defaultValue":"คืนสิทธิ์"}
// @tolgee-key {"key":"admin.promotionsFormat.text","ns":"promotions","defaultValue":"ส่วนลดสูงผิดปกติ / สงสัยปั่นยอด"}
// @tolgee-key {"key":"admin.promotionsFormat.text2","ns":"promotions","defaultValue":"ข้อมูลโค้ดไม่ถูกต้อง"}
// @tolgee-key {"key":"admin.promotionsFormat.text3","ns":"promotions","defaultValue":"เหตุผลอื่น"}
// @tolgee-key {"key":"admin.promotionsFormat.periodHint","ns":"promotions","defaultValue":"เหลือ {value} วัน"}
// @tolgee-key {"key":"admin.promotionsFormat.periodHint2","ns":"promotions","defaultValue":"เริ่มใน {value} วัน"}
// @tolgee-key {"key":"admin.promotionsFormat.periodHint3","ns":"promotions","defaultValue":"หยุดโดยแอดมิน"}
// @tolgee-key {"key":"admin.promotionsFormat.periodHint4","ns":"promotions","defaultValue":"สิ้นสุดแล้ว"}
// @tolgee-key {"key":"admin.promotionsFormat.periodHint5","ns":"promotions","defaultValue":"สิทธิ์ครบแล้ว"}
// @tolgee-key {"key":"admin.promotionsFormat.discountLabel","ns":"promotions","defaultValue":"ส่งฟรี"}
// @tolgee-key {"key":"admin.promotionsFormat.discountLabel2","ns":"promotions","defaultValue":"ลด {discountValue}%"}
// @tolgee-key {"key":"admin.promotionsFormat.discountLabel3","ns":"promotions","defaultValue":"ลด {value}"}
// @tolgee-key {"key":"admin.promotionsFormat.discountCapLabel","ns":"promotions","defaultValue":"สูงสุด {value} / ร้าน"}
// @tolgee-key {"key":"admin.promotionsFormat.discountCapLabel2","ns":"promotions","defaultValue":"สูงสุด {value}"}
// @tolgee-key {"key":"admin.promotionsFormat.minSpendLabel","ns":"promotions","defaultValue":"ขั้นต่ำ {value}"}
// @tolgee-key {"key":"admin.promotionsFormat.minSpendLabel2","ns":"promotions","defaultValue":"ไม่มีขั้นต่ำ"}
// @tolgee-key {"key":"admin.promotionsFormat.scopeLabel","ns":"promotions","defaultValue":"ทุกสินค้าในร้าน"}
// @tolgee-key {"key":"admin.promotionsFormat.scopeLabel2","ns":"promotions","defaultValue":"ทุกเกม"}
// @tolgee-key {"key":"admin.promotionsFormat.scopeLabel3","ns":"promotions","defaultValue":"เลือกเกม"}
// @tolgee-key {"key":"admin.promotionsFormat.scopeLabel4","ns":"promotions","defaultValue":"เลือกหมวดหมู่"}
// @tolgee-key {"key":"admin.promotionsFormat.prefix","ns":"promotions","defaultValue":"เกม"}
// @tolgee-key {"key":"admin.promotionsFormat.prefix2","ns":"promotions","defaultValue":"หมวด"}
// @tolgee-key {"key":"admin.promotionsFormat.conditionDetail","ns":"promotions","defaultValue":"เฉพาะผู้ซื้อใหม่"}
// @tolgee-key {"key":"admin.promotionsFormat.conditionDetail2","ns":"promotions","defaultValue":"{value} · {usageLimitPerUser} สิทธิ์/คน"}
// @tolgee-key {"key":"admin.promotionsFormat.limitLabel","ns":"promotions","defaultValue":"ไม่จำกัด"}
// @tolgee-key {"key":"admin.promotionsFormat.budgetFormula","ns":"promotions","defaultValue":"{limit} สิทธิ์ × ส่วนลดสูงสุด {amount}"}
// @tolgee-key {"key":"admin.promotionsFormat.promotionErrorMessage","ns":"promotions","defaultValue":"โค้ดนี้มีอยู่แล้ว (PROMO_CODE_TAKEN) — ลองเพิ่มตัวเลขต่อท้าย"}
// @tolgee-key {"key":"admin.promotionsFormat.promotionErrorMessage2","ns":"promotions","defaultValue":"โค้ดถูกเก็บหรือใช้แล้ว (PROMO_IN_USE)"}
// @tolgee-key {"key":"admin.promotionsFormat.promotionErrorMessage3","ns":"promotions","defaultValue":"ไม่พบโค้ดนี้แล้ว ลองโหลดหน้าใหม่"}
// @tolgee-key {"key":"admin.promotionsFormat.promotionErrorMessage4","ns":"promotions","defaultValue":"เกมที่เลือกถูกลบไปแล้ว ลองเลือกใหม่"}
// @tolgee-key {"key":"admin.promotionsFormat.promotionErrorMessage5","ns":"promotions","defaultValue":"หมวดหมู่ที่เลือกถูกลบไปแล้ว ลองเลือกใหม่"}
// @tolgee-key {"key":"admin.promotionsFormat.promotionErrorMessage6","ns":"promotions","defaultValue":"ข้อมูลโค้ดไม่ผ่านเงื่อนไข ตรวจค่าที่กรอกอีกครั้ง"}
// @tolgee-key {"key":"admin.promotionsFormat.promotionErrorMessage7","ns":"promotions","defaultValue":"โค้ดร้านแก้ไขหรือลบจากหน้านี้ไม่ได้"}
// @tolgee-key {"key":"admin.promotionsFormat.code","ns":"promotions","defaultValue":"รหัสโค้ด"}
// @tolgee-key {"key":"admin.promotionsFormat.name","ns":"promotions","defaultValue":"ชื่อแคมเปญ"}
// @tolgee-key {"key":"admin.promotionsFormat.description","ns":"promotions","defaultValue":"คำอธิบาย"}
// @tolgee-key {"key":"admin.promotionsFormat.discountType","ns":"promotions","defaultValue":"ประเภทส่วนลด"}
// @tolgee-key {"key":"admin.promotionsFormat.discountValue","ns":"promotions","defaultValue":"มูลค่าส่วนลด"}
// @tolgee-key {"key":"admin.promotionsFormat.maxDiscount","ns":"promotions","defaultValue":"ส่วนลดสูงสุด"}
// @tolgee-key {"key":"admin.promotionsFormat.minSpend","ns":"promotions","defaultValue":"ยอดขั้นต่ำ"}
// @tolgee-key {"key":"admin.promotionsFormat.scopeType","ns":"promotions","defaultValue":"ใช้กับสินค้า"}
// @tolgee-key {"key":"admin.promotionsFormat.scopeIds","ns":"promotions","defaultValue":"เกม / หมวดหมู่"}
// @tolgee-key {"key":"admin.promotionsFormat.visibility","ns":"promotions","defaultValue":"การมองเห็น"}
// @tolgee-key {"key":"admin.promotionsFormat.usageLimitTotal","ns":"promotions","defaultValue":"จำนวนสิทธิ์ใช้"}
// @tolgee-key {"key":"admin.promotionsFormat.usageLimitPerUser","ns":"promotions","defaultValue":"สิทธิ์ต่อคน"}
// @tolgee-key {"key":"admin.promotionsFormat.startsAt","ns":"promotions","defaultValue":"วันเริ่ม"}
// @tolgee-key {"key":"admin.promotionsFormat.endsAt","ns":"promotions","defaultValue":"วันสิ้นสุด"}
// @tolgee-key {"key":"admin.promotionsFormat.claimable","ns":"promotions","defaultValue":"ให้กดเก็บ"}
// @tolgee-key {"key":"admin.promotionsFormat.claimRequired","ns":"promotions","defaultValue":"ต้องเก็บก่อนใช้"}
// @tolgee-key {"key":"admin.promotionsFormat.claimLimit","ns":"promotions","defaultValue":"จำนวนที่แจก"}
// @tolgee-key {"key":"admin.promotionsFormat.featuredOnHome","ns":"promotions","defaultValue":"แสดงบนหน้าแรก"}
// @tolgee-key {"key":"admin.promotionsFormat.homeSort","ns":"promotions","defaultValue":"ลำดับบนหน้าแรก"}
// @tolgee-key {"key":"admin.promotionsFormat.PERCENT","ns":"promotions","defaultValue":"เปอร์เซ็นต์"}
// @tolgee-key {"key":"admin.promotionsFormat.FIXED","ns":"promotions","defaultValue":"จำนวนเงิน"}
// @tolgee-key {"key":"admin.promotionsFormat.formatFieldValue","ns":"promotions","defaultValue":"สาธารณะ"}
// @tolgee-key {"key":"admin.promotionsFormat.formatFieldValue2","ns":"promotions","defaultValue":"ส่วนตัว"}
// @tolgee-key {"key":"admin.promotionsFormat.formatFieldValue3","ns":"promotions","defaultValue":"เปิด"}
// @tolgee-key {"key":"admin.promotionsFormat.formatFieldValue4","ns":"promotions","defaultValue":"ปิด"}

/** ตารางหน้ารวมตาม Figma PRM-A1 — 8 แถวต่อหน้า */
export const PROMOTION_PAGE_SIZE = 8;
export const REDEMPTION_PAGE_SIZE = 20;
/** แถบ "โค้ดส่วนลดจาก Pegasus" บนหน้าแรกแสดงได้ไม่เกินนี้ (`HOME_STRIP_MAX` ฝั่ง backend) */
export const HOME_STRIP_MAX = 8;

/** ตะกร้าตัวอย่างในการ์ด "ตัวอย่างการคำนวณ" — คิดฝั่งหน้าเว็บเพื่อแสดงเท่านั้น */
export const SAMPLE_SUBTOTAL = 2400;
/** ค่าส่งต่อร้านที่ใช้ประเมินโค้ดส่งฟรีเมื่อไม่ได้ตั้งเพดาน */
export const SAMPLE_SHIPPING = 60;

export const STATUS_TABS: Array<{ value: PromotionStatus | null; label: string }> = [
  { value: null, get label() { return translate("promotions", "admin.promotionsFormat.label", "ทั้งหมด"); } },
  { value: "ACTIVE", get label() { return translate("promotions", "admin.promotionsFormat.label2", "ใช้งานอยู่"); } },
  { value: "SCHEDULED", get label() { return translate("promotions", "admin.promotionsFormat.label3", "ตั้งเวลาไว้"); } },
  { value: "PAUSED", get label() { return translate("promotions", "admin.promotionsFormat.label4", "หยุดชั่วคราว"); } },
  { value: "EXPIRED", get label() { return translate("promotions", "admin.promotionsFormat.label5", "หมดอายุ"); } },
];

export const STATUS_LABEL: Record<PromotionStatus, string> = {
  get ACTIVE() { return translate("promotions", "admin.promotionsFormat.label2", "ใช้งานอยู่"); },
  get SCHEDULED() { return translate("promotions", "admin.promotionsFormat.label3", "ตั้งเวลาไว้"); },
  get PAUSED() { return translate("promotions", "admin.promotionsFormat.label4", "หยุดชั่วคราว"); },
  get EXPIRED() { return translate("promotions", "admin.promotionsFormat.label5", "หมดอายุ"); },
  get USED_UP() { return translate("promotions", "admin.promotionsFormat.USEDUP", "สิทธิ์เต็ม"); },
};

export const STATUS_STYLE: Record<PromotionStatus, string> = {
  ACTIVE: "bg-[#e7f6ee] text-[#007a4a]",
  SCHEDULED: "bg-[#e8f1fc] text-[#0058bc]",
  PAUSED: "bg-[#fdf0dd] text-[#b45309]",
  EXPIRED: "bg-muted text-muted-foreground",
  USED_UP: "bg-[#fde8e8] text-[#b42318]",
};

export const REDEMPTION_STATUS_LABEL: Record<RedemptionStatus, string> = {
  get CONSUMED() { return translate("promotions", "admin.promotionsFormat.CONSUMED", "ใช้แล้ว"); },
  get RESERVED() { return translate("promotions", "admin.promotionsFormat.RESERVED", "จองไว้"); },
  get RELEASED() { return translate("promotions", "admin.promotionsFormat.RELEASED", "คืนสิทธิ์"); },
};

export const REDEMPTION_STATUS_STYLE: Record<RedemptionStatus, string> = {
  CONSUMED: "bg-[#e7f6ee] text-[#007a4a]",
  RESERVED: "bg-[#e8f1fc] text-[#0058bc]",
  RELEASED: "bg-muted text-muted-foreground",
};

/** เหตุผลให้เลือกตอนหยุดโค้ดร้าน (Figma PRM-M1) — ส่งไปพร้อมรายละเอียดเป็นข้อความเดียว */
export const sellerPauseReasons = () => [
  translate("promotions", "admin.promotionsFormat.text", "ส่วนลดสูงผิดปกติ / สงสัยปั่นยอด"),
  translate("promotions", "admin.promotionsFormat.text2", "ข้อมูลโค้ดไม่ถูกต้อง"),
  translate("promotions", "admin.promotionsFormat.text3", "เหตุผลอื่น"),
];

export function formatBaht(amount: number | null | undefined): string {
  return formatMoney(Number(amount ?? 0));
}

// ปีตาม Figma เป็น ค.ศ. ("1 พ.ย. 2026") จึงบังคับปฏิทินเกรกอเรียน
const dayMonthYear = dateTimeFormat({
  day: "numeric",
  month: "short",
  year: "numeric",
}, { calendar: "gregory" });
const dayMonth = dateTimeFormat({ day: "numeric", month: "short" }, { calendar: "gregory" });
const dateTime = dateTimeFormat({
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}, { calendar: "gregory" });

/** "30 พ.ย. 2026" */
export function formatPromoDate(value: string): string {
  return dayMonthYear.format(new Date(value));
}

/** "28 ต.ค. 2026 14:20" */
export function formatPromoDateTime(value: string): string {
  return dateTime.format(new Date(value));
}

/** "1 พ.ย. – 30 พ.ย. 2026" — ปีเดียวกันพิมพ์ปีครั้งเดียว */
export function formatPeriod(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return "—";
  if (start.getFullYear() === end.getFullYear()) {
    return `${dayMonth.format(start)} – ${dayMonthYear.format(end)}`;
  }
  return `${dayMonthYear.format(start)} – ${dayMonthYear.format(end)}`;
}

const DAY_MS = 86_400_000;

/** บรรทัดเล็กใต้ระยะเวลา: "เหลือ 16 วัน" / "เริ่มใน 36 วัน" / "หยุดโดยแอดมิน" */
export function periodHint(promotion: AdminPromotion, now: number): string {
  switch (promotion.status) {
    case "ACTIVE":
      return translate("promotions", "admin.promotionsFormat.periodHint", "เหลือ {value} วัน", { value: Math.max(0, Math.ceil((Date.parse(promotion.endsAt) - now) / DAY_MS)) });
    case "SCHEDULED":
      return translate("promotions", "admin.promotionsFormat.periodHint2", "เริ่มใน {value} วัน", { value: Math.max(0, Math.ceil((Date.parse(promotion.startsAt) - now) / DAY_MS)) });
    case "PAUSED":
      return translate("promotions", "admin.promotionsFormat.periodHint3", "หยุดโดยแอดมิน");
    case "EXPIRED":
      return translate("promotions", "admin.promotionsFormat.periodHint4", "สิ้นสุดแล้ว");
    case "USED_UP":
      return translate("promotions", "admin.promotionsFormat.periodHint5", "สิทธิ์ครบแล้ว");
  }
}

type DiscountFields = Pick<AdminPromotionInput, "discountType" | "discountValue" | "maxDiscount">;

/** "ลด 10%" / "ลด THB 150.00" / "ส่งฟรี" */
export function discountLabel(promotion: DiscountFields): string {
  if (promotion.discountType === "FREE_SHIPPING") return translate("promotions", "admin.promotionsFormat.discountLabel", "ส่งฟรี");
  if (promotion.discountType === "PERCENT") return translate("promotions", "admin.promotionsFormat.discountLabel2", "ลด {discountValue}%", { discountValue: promotion.discountValue });
  return translate("promotions", "admin.promotionsFormat.discountLabel3", "ลด {value}", { value: formatBaht(promotion.discountValue) });
}

/** บรรทัดรองของคอลัมน์ส่วนลด — โค้ดลดเป็นบาทไม่มีเพดาน */
export function discountCapLabel(promotion: DiscountFields): string {
  if (promotion.discountType === "FREE_SHIPPING") {
    return translate("promotions", "admin.promotionsFormat.discountCapLabel", "สูงสุด {value} / ร้าน", { value: formatBaht(promotion.maxDiscount ?? SAMPLE_SHIPPING) });
  }
  if (promotion.discountType === "PERCENT" && promotion.maxDiscount != null) {
    return translate("promotions", "admin.promotionsFormat.discountCapLabel2", "สูงสุด {value}", { value: formatBaht(promotion.maxDiscount) });
  }
  return "—";
}

export function minSpendLabel(minSpend: number): string {
  return minSpend > 0 ? translate("promotions", "admin.promotionsFormat.minSpendLabel", "ขั้นต่ำ {value}", { value: formatBaht(minSpend) }) : translate("promotions", "admin.promotionsFormat.minSpendLabel2", "ไม่มีขั้นต่ำ");
}

/** id → ชื่อ แยกตามชนิดเพราะ id ของเกมกับหมวดชนกันได้ */
export type ScopeNames = { games: Map<number, string>; categories: Map<number, string> };

/**
 * ขอบเขตของโค้ด: "ทุกเกม" / "เกม One Piece" / "หมวด Booster Box"
 * ถ้ายังโหลดชื่อไม่เสร็จใช้คำกลาง ๆ ไปก่อน
 */
export function scopeLabel(
  promotion: Pick<AdminPromotion, "scopeType" | "scopeIds" | "ownerType">,
  names: ScopeNames,
): string {
  if (promotion.scopeType === "ALL") {
    return promotion.ownerType === "SELLER" ? translate("promotions", "admin.promotionsFormat.scopeLabel", "ทุกสินค้าในร้าน") : translate("promotions", "admin.promotionsFormat.scopeLabel2", "ทุกเกม");
  }
  const lookup = promotion.scopeType === "GAME" ? names.games : names.categories;
  const known = promotion.scopeIds.map((id) => lookup.get(id)).filter(Boolean);
  if (known.length === 0) return promotion.scopeType === "GAME" ? translate("promotions", "admin.promotionsFormat.scopeLabel3", "เลือกเกม") : translate("promotions", "admin.promotionsFormat.scopeLabel4", "เลือกหมวดหมู่");
  const prefix = promotion.scopeType === "GAME" ? translate("promotions", "admin.promotionsFormat.prefix", "เกม") : translate("promotions", "admin.promotionsFormat.prefix2", "หมวด");
  const shown = known.slice(0, 2).join(", ");
  return known.length > 2 ? `${prefix} ${shown} +${known.length - 2}` : `${prefix} ${shown}`;
}

/** บรรทัดรองของคอลัมน์เงื่อนไข */
export function conditionDetail(promotion: AdminPromotion, names: ScopeNames): string {
  if (promotion.newBuyerOnly) return translate("promotions", "admin.promotionsFormat.conditionDetail", "เฉพาะผู้ซื้อใหม่");
  return translate("promotions", "admin.promotionsFormat.conditionDetail2", "{value} · {usageLimitPerUser} สิทธิ์/คน", { value: scopeLabel(promotion, names), usageLimitPerUser: promotion.usageLimitPerUser });
}

/** บรรทัดรองของคอลัมน์โค้ด — โค้ดร้านขึ้นต้นด้วย username ของร้าน */
export function promotionSubtitle(promotion: AdminPromotion): string {
  if (promotion.ownerType === "SELLER" && promotion.owner) {
    return `${promotion.owner.username} · ${promotion.name}`;
  }
  return promotion.name;
}

export function usagePercent(promotion: AdminPromotion): number {
  if (!promotion.usageLimitTotal) return 0;
  return Math.min(100, (100 * promotion.usedCount) / promotion.usageLimitTotal);
}

export function isUsageFull(promotion: AdminPromotion): boolean {
  return promotion.usageLimitTotal != null && promotion.usedCount >= promotion.usageLimitTotal;
}

export function limitLabel(value: number | null): string {
  return value == null ? translate("promotions", "admin.promotionsFormat.limitLabel", "ไม่จำกัด") : value.toLocaleString(intlLocale());
}

/**
 * ส่วนลดสูงสุดต่อออเดอร์ที่ Pegasus อาจต้องออก — `null` = ไม่มีเพดาน (เปอร์เซ็นต์ที่ไม่ใส่สูงสุด)
 * โค้ดส่งฟรีที่ไม่ใส่เพดานประเมินจากค่าส่งตัวอย่าง
 */
export function maxDiscountPerOrder(input: DiscountFields): number | null {
  if (input.discountType === "FIXED") return Number(input.discountValue || 0);
  if (input.discountType === "FREE_SHIPPING") return input.maxDiscount ?? SAMPLE_SHIPPING;
  return input.maxDiscount;
}

/** งบสูงสุดของแคมเปญ = สิทธิ์ทั้งหมด × ส่วนลดสูงสุดต่อออเดอร์ — `null` = ไม่จำกัด */
export function campaignBudget(
  input: DiscountFields & Pick<AdminPromotionInput, "usageLimitTotal">,
): number | null {
  const perOrder = maxDiscountPerOrder(input);
  if (perOrder == null || input.usageLimitTotal == null) return null;
  return perOrder * input.usageLimitTotal;
}

export function budgetLabel(input: DiscountFields & Pick<AdminPromotionInput, "usageLimitTotal">): string {
  const budget = campaignBudget(input);
  return budget == null ? translate("promotions", "admin.promotionsFormat.limitLabel", "ไม่จำกัด") : formatBaht(budget);
}

/**
 * ที่มาของงบสูงสุด ใช้ตัวเลขชุดเดียวกับ `campaignBudget` เสมอ
 * สั้น "500 × THB 200.00" ใน modal ยืนยัน · ยาว "500 สิทธิ์ × ส่วนลดสูงสุด THB 200.00" ในการ์ดข้างฟอร์ม
 */
export function budgetFormula(
  input: DiscountFields & Pick<AdminPromotionInput, "usageLimitTotal">,
  verbose = false,
): string {
  const perOrder = maxDiscountPerOrder(input);
  const amount = perOrder == null ? translate("promotions", "admin.promotionsFormat.limitLabel", "ไม่จำกัด") : formatBaht(perOrder);
  const limit = limitLabel(input.usageLimitTotal);
  return verbose ? translate("promotions", "admin.promotionsFormat.budgetFormula", "{limit} สิทธิ์ × ส่วนลดสูงสุด {amount}", { limit, amount }) : `${limit} × ${amount}`;
}

/** ตะกร้า THB 2,400 ตามการ์ดใน Figma PRM-A2 */
export function sampleCalculation(input: DiscountFields) {
  const subtotal = SAMPLE_SUBTOTAL;
  let discount: number;
  if (input.discountType === "PERCENT") {
    discount = Math.min((subtotal * Number(input.discountValue || 0)) / 100, input.maxDiscount ?? Infinity);
  } else if (input.discountType === "FIXED") {
    discount = Math.min(subtotal, Number(input.discountValue || 0));
  } else {
    discount = Math.min(SAMPLE_SHIPPING, input.maxDiscount ?? SAMPLE_SHIPPING);
  }
  const buyerPays = input.discountType === "FREE_SHIPPING" ? subtotal : subtotal - discount;
  return { subtotal, discount, buyerPays, sellerReceives: subtotal };
}

/** "ธนภัทร ส." — ชื่อแรกเต็ม ที่เหลือเหลือตัวแรก ไม่มีชื่อแสดงใช้ username */
export function maskBuyer(buyer: PromotionParty | string): string {
  if (typeof buyer === "string") {
    const parts = buyer.trim().split(/\s+/);
    if (parts.length > 1) return `${parts[0]} ${parts.slice(1).map((part) => `${part[0]}.`).join(" ")}`;
    return buyer.length > 2 ? `${buyer[0]}***${buyer.at(-1)}` : `${buyer[0] ?? ""}*`;
  }
  const name = buyer.displayName?.trim();
  if (!name) return buyer.username;
  return name
    .split(/\s+/)
    .map((part, index) => (index === 0 ? part : `${part[0]}.`))
    .join(" ");
}

/** "3.1%" — ทศนิยมหนึ่งตำแหน่ง ตัวหารเป็นศูนย์ได้ `null` */
export function percentOf(part: number, whole: number): string | null {
  if (!whole) return null;
  return `${((100 * part) / whole).toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}%`;
}

/** ข้อความ error ของหน้านี้ — แปลจาก `ApiError.code` (ภายหลังย้ายไป Tolgee ได้) */
export function promotionErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "PROMO_CODE_TAKEN")) return translate("promotions", "admin.promotionsFormat.promotionErrorMessage", "โค้ดนี้มีอยู่แล้ว (PROMO_CODE_TAKEN) — ลองเพิ่มตัวเลขต่อท้าย");
  if (hasErrorCode(error, "PROMO_IN_USE")) return translate("promotions", "admin.promotionsFormat.promotionErrorMessage2", "โค้ดถูกเก็บหรือใช้แล้ว (PROMO_IN_USE)");
  if (hasErrorCode(error, "PROMO_NOT_FOUND")) return translate("promotions", "admin.promotionsFormat.promotionErrorMessage3", "ไม่พบโค้ดนี้แล้ว ลองโหลดหน้าใหม่");
  if (hasErrorCode(error, "GAME_NOT_FOUND")) return translate("promotions", "admin.promotionsFormat.promotionErrorMessage4", "เกมที่เลือกถูกลบไปแล้ว ลองเลือกใหม่");
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) return translate("promotions", "admin.promotionsFormat.promotionErrorMessage5", "หมวดหมู่ที่เลือกถูกลบไปแล้ว ลองเลือกใหม่");
  if (hasErrorCode(error, "PROMO_INVALID")) return translate("promotions", "admin.promotionsFormat.promotionErrorMessage6", "ข้อมูลโค้ดไม่ผ่านเงื่อนไข ตรวจค่าที่กรอกอีกครั้ง");
  if (hasErrorCode(error, "ACCESS_DENIED")) return translate("promotions", "admin.promotionsFormat.promotionErrorMessage7", "โค้ดร้านแก้ไขหรือลบจากหน้านี้ไม่ได้");
  return fallback;
}

/**
 * โค้ดที่ขึ้นแถบหน้าแรกได้: โค้ด Pegasus สาธารณะที่กดเก็บได้ และยังไม่หมดอายุ (กติกาเดียวกับ backend)
 * โค้ดที่หยุดหรือสิทธิ์เต็มเพิ่มใหม่ไม่ได้ แต่ใบที่อยู่บนหน้าแรกแล้วยังเรียงได้
 */
export function isHomeCandidate(promotion: AdminPromotion): boolean {
  if (promotion.ownerType !== "PLATFORM" || !promotion.claimable || promotion.visibility !== "PUBLIC") return false;
  if (promotion.status === "EXPIRED") return false;
  return promotion.featuredOnHome || promotion.status === "ACTIVE" || promotion.status === "SCHEDULED";
}

/** ใบบนหน้าแรกตอนนี้ เรียงตาม `homeSort` */
export function currentHomeIds(promotions: AdminPromotion[]): number[] {
  return promotions
    .filter((promotion) => promotion.featuredOnHome && isHomeCandidate(promotion))
    .sort((a, b) => (a.homeSort ?? 0) - (b.homeSort ?? 0))
    .map((promotion) => promotion.id);
}

/** ชื่อฟิลด์ใน modal "บันทึกการเปลี่ยนแปลง?" */
export const FIELD_LABEL: Record<keyof AdminPromotionInput, string> = {
  get code() { return translate("promotions", "admin.promotionsFormat.code", "รหัสโค้ด"); },
  get name() { return translate("promotions", "admin.promotionsFormat.name", "ชื่อแคมเปญ"); },
  get description() { return translate("promotions", "admin.promotionsFormat.description", "คำอธิบาย"); },
  get discountType() { return translate("promotions", "admin.promotionsFormat.discountType", "ประเภทส่วนลด"); },
  get discountValue() { return translate("promotions", "admin.promotionsFormat.discountValue", "มูลค่าส่วนลด"); },
  get maxDiscount() { return translate("promotions", "admin.promotionsFormat.maxDiscount", "ส่วนลดสูงสุด"); },
  get minSpend() { return translate("promotions", "admin.promotionsFormat.minSpend", "ยอดขั้นต่ำ"); },
  get scopeType() { return translate("promotions", "admin.promotionsFormat.scopeType", "ใช้กับสินค้า"); },
  get scopeIds() { return translate("promotions", "admin.promotionsFormat.scopeIds", "เกม / หมวดหมู่"); },
  get visibility() { return translate("promotions", "admin.promotionsFormat.visibility", "การมองเห็น"); },
  get newBuyerOnly() { return translate("promotions", "admin.promotionsFormat.conditionDetail", "เฉพาะผู้ซื้อใหม่"); },
  get usageLimitTotal() { return translate("promotions", "admin.promotionsFormat.usageLimitTotal", "จำนวนสิทธิ์ใช้"); },
  get usageLimitPerUser() { return translate("promotions", "admin.promotionsFormat.usageLimitPerUser", "สิทธิ์ต่อคน"); },
  get startsAt() { return translate("promotions", "admin.promotionsFormat.startsAt", "วันเริ่ม"); },
  get endsAt() { return translate("promotions", "admin.promotionsFormat.endsAt", "วันสิ้นสุด"); },
  get claimable() { return translate("promotions", "admin.promotionsFormat.claimable", "ให้กดเก็บ"); },
  get claimRequired() { return translate("promotions", "admin.promotionsFormat.claimRequired", "ต้องเก็บก่อนใช้"); },
  get claimLimit() { return translate("promotions", "admin.promotionsFormat.claimLimit", "จำนวนที่แจก"); },
  get featuredOnHome() { return translate("promotions", "admin.promotionsFormat.featuredOnHome", "แสดงบนหน้าแรก"); },
  get homeSort() { return translate("promotions", "admin.promotionsFormat.homeSort", "ลำดับบนหน้าแรก"); },
};

const DISCOUNT_TYPE_LABEL = { get PERCENT() { return translate("promotions", "admin.promotionsFormat.PERCENT", "เปอร์เซ็นต์"); }, get FIXED() { return translate("promotions", "admin.promotionsFormat.FIXED", "จำนวนเงิน"); }, get FREE_SHIPPING() { return translate("promotions", "admin.promotionsFormat.discountLabel", "ส่งฟรี"); } } as const;
const SCOPE_TYPE_LABEL = { get ALL() { return translate("promotions", "admin.promotionsFormat.scopeLabel2", "ทุกเกม"); }, get GAME() { return translate("promotions", "admin.promotionsFormat.scopeLabel3", "เลือกเกม"); }, get CATEGORY() { return translate("promotions", "admin.promotionsFormat.scopeLabel4", "เลือกหมวดหมู่"); } } as const;

/** ค่าหนึ่งฟิลด์ในรูปที่คนอ่าน — "30 พ.ย. 2026" แทน ISO, "THB 200.00" แทน 200 */
export function formatFieldValue(key: keyof AdminPromotionInput, input: AdminPromotionInput, names: ScopeNames): string {
  const value = input[key];
  if (value == null || value === "") {
    if (key === "homeSort") return "—";
    return key === "usageLimitTotal" || key === "claimLimit" || key === "maxDiscount" ? translate("promotions", "admin.promotionsFormat.limitLabel", "ไม่จำกัด") : "—";
  }
  switch (key) {
    case "startsAt":
    case "endsAt":
      return formatPromoDateTime(String(value));
    case "discountValue":
      return input.discountType === "PERCENT" ? `${value}%` : formatBaht(Number(value));
    case "maxDiscount":
    case "minSpend":
      return formatBaht(Number(value));
    case "discountType":
      return DISCOUNT_TYPE_LABEL[input.discountType];
    case "scopeType":
      return SCOPE_TYPE_LABEL[input.scopeType];
    case "scopeIds":
      return input.scopeIds.length === 0 ? "—" : scopeLabel({ ...input, ownerType: "PLATFORM" }, names);
    case "visibility":
      return input.visibility === "PUBLIC" ? translate("promotions", "admin.promotionsFormat.formatFieldValue", "สาธารณะ") : translate("promotions", "admin.promotionsFormat.formatFieldValue2", "ส่วนตัว");
    case "homeSort":
      return String(Number(value) + 1);
    case "usageLimitTotal":
    case "usageLimitPerUser":
    case "claimLimit":
      return Number(value).toLocaleString(intlLocale());
    default:
      return typeof value === "boolean" ? (value ? translate("promotions", "admin.promotionsFormat.formatFieldValue3", "เปิด") : translate("promotions", "admin.promotionsFormat.formatFieldValue4", "ปิด")) : String(value);
  }
}
