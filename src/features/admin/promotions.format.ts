import { translate } from "@/lib/language";
import { hasErrorCode } from "@/lib/api";

import type {
  AdminPromotion,
  AdminPromotionInput,
  PromotionParty,
  PromotionStatus,
  RedemptionStatus,
} from "./promotions.types";

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
  { value: null, get label() { return translate("ทั้งหมด", "All"); } },
  { value: "ACTIVE", get label() { return translate("ใช้งานอยู่", "Active"); } },
  { value: "SCHEDULED", get label() { return translate("ตั้งเวลาไว้", "Scheduled"); } },
  { value: "PAUSED", get label() { return translate("หยุดชั่วคราว", "Paused"); } },
  { value: "EXPIRED", get label() { return translate("หมดอายุ", "Expired"); } },
];

export const STATUS_LABEL: Record<PromotionStatus, string> = {
  get ACTIVE() { return translate("ใช้งานอยู่", "Active"); },
  get SCHEDULED() { return translate("ตั้งเวลาไว้", "Scheduled"); },
  get PAUSED() { return translate("หยุดชั่วคราว", "Paused"); },
  get EXPIRED() { return translate("หมดอายุ", "Expired"); },
  get USED_UP() { return translate("สิทธิ์เต็ม", "Fully redeemed"); },
};

export const STATUS_STYLE: Record<PromotionStatus, string> = {
  ACTIVE: "bg-[#e7f6ee] text-[#007a4a]",
  SCHEDULED: "bg-[#e8f1fc] text-[#0058bc]",
  PAUSED: "bg-[#fdf0dd] text-[#b45309]",
  EXPIRED: "bg-muted text-muted-foreground",
  USED_UP: "bg-[#fde8e8] text-[#b42318]",
};

export const REDEMPTION_STATUS_LABEL: Record<RedemptionStatus, string> = {
  get CONSUMED() { return translate("ใช้แล้ว", "Used"); },
  RESERVED: "จองไว้",
  RELEASED: "คืนสิทธิ์",
};

export const REDEMPTION_STATUS_STYLE: Record<RedemptionStatus, string> = {
  CONSUMED: "bg-[#e7f6ee] text-[#007a4a]",
  RESERVED: "bg-[#e8f1fc] text-[#0058bc]",
  RELEASED: "bg-muted text-muted-foreground",
};

/** เหตุผลให้เลือกตอนหยุดโค้ดร้าน (Figma PRM-M1) — ส่งไปพร้อมรายละเอียดเป็นข้อความเดียว */
export const SELLER_PAUSE_REASONS = [
  "ส่วนลดสูงผิดปกติ / สงสัยปั่นยอด",
  "ข้อมูลโค้ดไม่ถูกต้อง",
  "เหตุผลอื่น",
];

export function formatBaht(amount: number | null | undefined): string {
  return `฿${Number(amount ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
}

// ปีตาม Figma เป็น ค.ศ. ("1 พ.ย. 2026") จึงบังคับปฏิทินเกรกอเรียน
const dayMonthYear = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dayMonth = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short" });
const dateTime = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

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
      return `เหลือ ${Math.max(0, Math.ceil((Date.parse(promotion.endsAt) - now) / DAY_MS))} วัน`;
    case "SCHEDULED":
      return `เริ่มใน ${Math.max(0, Math.ceil((Date.parse(promotion.startsAt) - now) / DAY_MS))} วัน`;
    case "PAUSED":
      return "หยุดโดยแอดมิน";
    case "EXPIRED":
      return translate("สิ้นสุดแล้ว", "Ended");
    case "USED_UP":
      return "สิทธิ์ครบแล้ว";
  }
}

type DiscountFields = Pick<AdminPromotionInput, "discountType" | "discountValue" | "maxDiscount">;

/** "ลด 10%" / "ลด ฿150" / "ส่งฟรี" */
export function discountLabel(promotion: DiscountFields): string {
  if (promotion.discountType === "FREE_SHIPPING") return translate("ส่งฟรี", "Free shipping");
  if (promotion.discountType === "PERCENT") return `ลด ${promotion.discountValue}%`;
  return `ลด ${formatBaht(promotion.discountValue)}`;
}

/** บรรทัดรองของคอลัมน์ส่วนลด — โค้ดลดเป็นบาทไม่มีเพดาน */
export function discountCapLabel(promotion: DiscountFields): string {
  if (promotion.discountType === "FREE_SHIPPING") {
    return `สูงสุด ${formatBaht(promotion.maxDiscount ?? SAMPLE_SHIPPING)} / ร้าน`;
  }
  if (promotion.discountType === "PERCENT" && promotion.maxDiscount != null) {
    return `สูงสุด ${formatBaht(promotion.maxDiscount)}`;
  }
  return "—";
}

export function minSpendLabel(minSpend: number): string {
  return minSpend > 0 ? `ขั้นต่ำ ${formatBaht(minSpend)}` : translate("ไม่มีขั้นต่ำ", "No minimum");
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
    return promotion.ownerType === "SELLER" ? translate("ทุกสินค้าในร้าน", "All products in the shop") : translate("ทุกเกม", "All games");
  }
  const lookup = promotion.scopeType === "GAME" ? names.games : names.categories;
  const known = promotion.scopeIds.map((id) => lookup.get(id)).filter(Boolean);
  if (known.length === 0) return promotion.scopeType === "GAME" ? translate("เลือกเกม", "Select game") : translate("เลือกหมวดหมู่", "Select category");
  const prefix = promotion.scopeType === "GAME" ? translate("เกม", "Game") : translate("หมวด", "Category");
  const shown = known.slice(0, 2).join(", ");
  return known.length > 2 ? `${prefix} ${shown} +${known.length - 2}` : `${prefix} ${shown}`;
}

/** บรรทัดรองของคอลัมน์เงื่อนไข */
export function conditionDetail(promotion: AdminPromotion, names: ScopeNames): string {
  if (promotion.newBuyerOnly) return translate("เฉพาะผู้ซื้อใหม่", "New buyers only");
  return `${scopeLabel(promotion, names)} · ${promotion.usageLimitPerUser} สิทธิ์/คน`;
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
  return value == null ? translate("ไม่จำกัด", "Unlimited") : value.toLocaleString("th-TH");
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
  return budget == null ? translate("ไม่จำกัด", "Unlimited") : formatBaht(budget);
}

/**
 * ที่มาของงบสูงสุด ใช้ตัวเลขชุดเดียวกับ `campaignBudget` เสมอ
 * สั้น "500 × ฿200" ใน modal ยืนยัน · ยาว "500 สิทธิ์ × ส่วนลดสูงสุด ฿200" ในการ์ดข้างฟอร์ม
 */
export function budgetFormula(
  input: DiscountFields & Pick<AdminPromotionInput, "usageLimitTotal">,
  verbose = false,
): string {
  const perOrder = maxDiscountPerOrder(input);
  const amount = perOrder == null ? translate("ไม่จำกัด", "Unlimited") : formatBaht(perOrder);
  const limit = limitLabel(input.usageLimitTotal);
  return verbose ? `${limit} สิทธิ์ × ส่วนลดสูงสุด ${amount}` : `${limit} × ${amount}`;
}

/** ตะกร้า ฿2,400 ตามการ์ดใน Figma PRM-A2 */
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
  return `${((100 * part) / whole).toLocaleString("th-TH", { maximumFractionDigits: 1 })}%`;
}

/** ข้อความ error ของหน้านี้ — แปลจาก `ApiError.code` (ภายหลังย้ายไป Tolgee ได้) */
export function promotionErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "PROMO_CODE_TAKEN")) return "โค้ดนี้มีอยู่แล้ว (PROMO_CODE_TAKEN) — ลองเพิ่มตัวเลขต่อท้าย";
  if (hasErrorCode(error, "PROMO_IN_USE")) return "โค้ดถูกเก็บหรือใช้แล้ว (PROMO_IN_USE)";
  if (hasErrorCode(error, "PROMO_NOT_FOUND")) return "ไม่พบโค้ดนี้แล้ว ลองโหลดหน้าใหม่";
  if (hasErrorCode(error, "GAME_NOT_FOUND")) return translate("เกมที่เลือกถูกลบไปแล้ว ลองเลือกใหม่", "The selected game was deleted. Choose another");
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) return translate("หมวดหมู่ที่เลือกถูกลบไปแล้ว ลองเลือกใหม่", "The selected category was deleted. Choose another");
  if (hasErrorCode(error, "PROMO_INVALID")) return "ข้อมูลโค้ดไม่ผ่านเงื่อนไข ตรวจค่าที่กรอกอีกครั้ง";
  if (hasErrorCode(error, "ACCESS_DENIED")) return "โค้ดร้านแก้ไขหรือลบจากหน้านี้ไม่ได้";
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
  code: "รหัสโค้ด",
  get name() { return translate("ชื่อแคมเปญ", "Campaign name"); },
  get description() { return translate("คำอธิบาย", "Description"); },
  get discountType() { return translate("ประเภทส่วนลด", "Discount type"); },
  get discountValue() { return translate("มูลค่าส่วนลด", "Discount value"); },
  get maxDiscount() { return translate("ส่วนลดสูงสุด", "Maximum discount"); },
  get minSpend() { return translate("ยอดขั้นต่ำ", "Minimum amount"); },
  get scopeType() { return translate("ใช้กับสินค้า", "Apply to products"); },
  scopeIds: "เกม / หมวดหมู่",
  get visibility() { return translate("การมองเห็น", "Visibility"); },
  get newBuyerOnly() { return translate("เฉพาะผู้ซื้อใหม่", "New buyers only"); },
  usageLimitTotal: "จำนวนสิทธิ์ใช้",
  get usageLimitPerUser() { return translate("สิทธิ์ต่อคน", "Redemptions per person"); },
  startsAt: "วันเริ่ม",
  endsAt: "วันสิ้นสุด",
  claimable: "ให้กดเก็บ",
  get claimRequired() { return translate("ต้องเก็บก่อนใช้", "Must be claimed before use"); },
  get claimLimit() { return translate("จำนวนที่แจก", "Number issued"); },
  get featuredOnHome() { return translate("แสดงบนหน้าแรก", "Show on home page"); },
  get homeSort() { return translate("ลำดับบนหน้าแรก", "Home page display order"); },
};

const DISCOUNT_TYPE_LABEL = { get PERCENT() { return translate("เปอร์เซ็นต์", "Percentage"); }, get FIXED() { return translate("จำนวนเงิน", "Amount"); }, get FREE_SHIPPING() { return translate("ส่งฟรี", "Free shipping"); } } as const;
const SCOPE_TYPE_LABEL = { get ALL() { return translate("ทุกเกม", "All games"); }, get GAME() { return translate("เลือกเกม", "Select game"); }, get CATEGORY() { return translate("เลือกหมวดหมู่", "Select category"); } } as const;

/** ค่าหนึ่งฟิลด์ในรูปที่คนอ่าน — "30 พ.ย. 2026" แทน ISO, "฿200" แทน 200 */
export function formatFieldValue(key: keyof AdminPromotionInput, input: AdminPromotionInput, names: ScopeNames): string {
  const value = input[key];
  if (value == null || value === "") {
    if (key === "homeSort") return "—";
    return key === "usageLimitTotal" || key === "claimLimit" || key === "maxDiscount" ? translate("ไม่จำกัด", "Unlimited") : "—";
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
      return input.visibility === "PUBLIC" ? translate("สาธารณะ", "Public") : translate("ส่วนตัว", "Private");
    case "homeSort":
      return String(Number(value) + 1);
    case "usageLimitTotal":
    case "usageLimitPerUser":
    case "claimLimit":
      return Number(value).toLocaleString("th-TH");
    default:
      return typeof value === "boolean" ? (value ? translate("เปิด", "Open") : translate("ปิด", "Close")) : String(value);
  }
}
