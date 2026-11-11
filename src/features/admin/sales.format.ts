import { hasErrorCode } from "@/lib/api";

import { formatBaht, formatPeriod } from "./promotions.format";
import type { AdminSale, SaleOwnerType, SaleStatus, SaleType } from "./sales.types";
import { dateTimeFormat, intlLocale, translate } from "@/lib/i18n";

/** ตาราง Figma SAL-A1 — 8 แถวต่อหน้าเหมือนแท็บโค้ด */
export const SALE_PAGE_SIZE = 8;
/** Flash Sale ยาวได้ไม่เกินนี้ (CHECK ใน `price_sale`) */
export const FLASH_MAX_HOURS = 72;
/** preview-scope รอให้หยุดพิมพ์ก่อนค่อยยิง */
export const SCOPE_PREVIEW_DEBOUNCE_MS = 400;
/** listing ตัวอย่างในการ์ด "ตัวอย่างการคำนวณ" (Figma SAL-A2) — คิดเพื่อแสดงเท่านั้น */
export const SAMPLE_LIST_PRICE = 4200;
export const SAMPLE_COMMISSION_RATE = 0.05;

export const SALE_STATUS_TABS: Array<{ value: SaleStatus | null; label: string }> = [
  { value: null, get label() { return translate("sale", "admin.tabs.all", "ทั้งหมด"); } },
  { value: "ACTIVE", get label() { return translate("sale", "admin.status.ACTIVE", "กำลังลด"); } },
  { value: "SCHEDULED", get label() { return translate("sale", "admin.status.SCHEDULED", "ตั้งเวลาไว้"); } },
  { value: "PAUSED", get label() { return translate("sale", "admin.status.PAUSED", "หยุดชั่วคราว"); } },
  { value: "ENDED", get label() { return translate("sale", "admin.status.ENDED", "จบแล้ว"); } },
];

export const SALE_TYPE_FILTERS: Array<{ value: SaleType | null; label: string }> = [
  { value: null, get label() { return translate("sale", "admin.type.all", "ทุกประเภท"); } },
  { value: "FLASH_SALE", label: "Flash Sale" },
  { value: "CATEGORY_SALE", get label() { return translate("sale", "admin.type.category", "ลดทั้งหมวด"); } },
  { value: "SHOP_SALE", get label() { return translate("sale", "admin.type.shop", "ร้านค้า"); } },
];

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  get ACTIVE() { return translate("sale", "admin.status.ACTIVE", "กำลังลด"); },
  get SCHEDULED() { return translate("sale", "admin.status.SCHEDULED", "ตั้งเวลาไว้"); },
  get PAUSED() { return translate("sale", "admin.status.PAUSED", "หยุดชั่วคราว"); },
  get ENDED() { return translate("sale", "admin.status.ENDED", "จบแล้ว"); },
  get SOLD_OUT() { return translate("sale", "admin.status.SOLD_OUT", "ขายหมด"); },
  get BUDGET_EXHAUSTED() { return translate("sale", "admin.status.BUDGET_EXHAUSTED", "หมดงบ"); },
};

export const SALE_STATUS_STYLE: Record<SaleStatus, string> = {
  ACTIVE: "bg-[#e7f6ee] text-[#007a4a]",
  SCHEDULED: "bg-[#e8f1fc] text-[#0058bc]",
  PAUSED: "bg-[#fdf0dd] text-[#b45309]",
  ENDED: "bg-[#eef1f2] text-muted-foreground",
  SOLD_OUT: "bg-[#fde8e8] text-[#b42318]",
  BUDGET_EXHAUSTED: "bg-[#eef1f2] text-muted-foreground",
};

/** จบไปแล้ว ไม่ว่าด้วยเหตุผลใด — ไม่มีปุ่มหยุด/จบ */
export function isFinished(status: SaleStatus): boolean {
  return status === "ENDED" || status === "SOLD_OUT" || status === "BUDGET_EXHAUSTED";
}

export function ownerLabel(owner: SaleOwnerType): string {
  return owner === "PLATFORM" ? "Pegasus" : translate("sale", "admin.type.shop", "ร้านค้า");
}

const dayMonthYear = dateTimeFormat({ day: "numeric", month: "short", year: "numeric" }, { calendar: "gregory" });
const dayMonth = dateTimeFormat({ day: "numeric", month: "short" }, { calendar: "gregory" });
const time = dateTimeFormat({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, { calendar: "gregory" });

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** ชั่วโมงระหว่างสองเวลา (ทศนิยมได้) */
export function hoursBetween(startsAt: string, endsAt: string): number {
  return (Date.parse(endsAt) - Date.parse(startsAt)) / 3_600_000;
}

/** "ยาว 24 ชั่วโมง" / "ยาว 3 วัน" */
export function durationLabel(startsAt: string, endsAt: string): string {
  const hours = hoursBetween(startsAt, endsAt);
  if (!Number.isFinite(hours) || hours <= 0) return "";
  // 00:00–23:59 นับเป็น 24 ชม. ตาม Figma
  const rounded = Math.round(hours);
  if (rounded <= FLASH_MAX_HOURS) return translate("sale", "admin.duration.hours", "ยาว {hours} ชั่วโมง", { hours: rounded });
  return translate("sale", "admin.duration.days", "ยาว {days} วัน", { days: Math.round(hours / 24) });
}

/** บรรทัดแรกของคอลัมน์ระยะเวลา: วันเดียว "11 พ.ย. 2026" · หลายวัน "1–30 พ.ย. 2026" */
export function salePeriod(sale: Pick<AdminSale, "startsAt" | "endsAt">): string {
  const start = new Date(sale.startsAt);
  const end = new Date(sale.endsAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return "—";
  if (sameDay(start, end)) return dayMonthYear.format(start);
  // 2 พ.ย. 22:00 – 3 พ.ย. 02:00 (ข้ามวันแต่ไม่ถึงวัน)
  if (hoursBetween(sale.startsAt, sale.endsAt) < 24) return `${dayMonth.format(start)} ${time.format(start)}`;
  return compactRange(start, end);
}

const monthShort = dateTimeFormat({ month: "short" }, { calendar: "gregory" });

/** "1–30 พ.ย. 2026" · "25 ต.ค. – 10 พ.ย." (ปีนี้) · ข้ามปีพิมพ์ปีทั้งสองฝั่ง */
function compactRange(start: Date, end: Date): string {
  const thisYear = new Date().getFullYear();
  if (start.getFullYear() !== end.getFullYear()) return formatPeriod(start.toISOString(), end.toISOString());
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${monthShort.format(end)} ${end.getFullYear()}`;
  }
  const range = `${dayMonth.format(start)} – ${dayMonth.format(end)}`;
  return end.getFullYear() === thisYear ? range : `${range} ${end.getFullYear()}`;
}

const DAY_MS = 86_400_000;

/** บรรทัดเล็กใต้ระยะเวลา: "00:00–23:59 · อีก 8 วัน" / "เหลือ 27 วัน" / "หยุดโดยแอดมิน · …" */
export function salePeriodHint(sale: AdminSale, now: number): string {
  const start = new Date(sale.startsAt);
  const end = new Date(sale.endsAt);
  const days = (target: number) => Math.max(0, Math.ceil((target - now) / DAY_MS));
  const clock = sameDay(start, end)
    ? `${time.format(start)}–${time.format(end)}`
    : hoursBetween(sale.startsAt, sale.endsAt) < 24
      ? `– ${dayMonth.format(end)} ${time.format(end)}`
      : null;
  switch (sale.status) {
    case "SCHEDULED":
      return clock
        ? translate("sale", "admin.period.clockIn", "{clock} · อีก {days} วัน", { clock, days: days(start.getTime()) })
        : translate("sale", "admin.period.startsIn", "เริ่มใน {days} วัน", { days: days(start.getTime()) });
    case "ACTIVE":
      return clock ?? translate("sale", "admin.period.daysLeft", "เหลือ {days} วัน", { days: days(end.getTime()) });
    case "PAUSED":
      return isPausedByAdmin(sale)
        ? translate("sale", "admin.period.pausedByAdmin", "หยุดโดยแอดมิน{reason}", { reason: sale.pauseReason ? ` · ${sale.pauseReason}` : "" })
        : translate("sale", "admin.period.pausedByShop", "ร้านหยุดไว้");
    case "SOLD_OUT":
      return clock ?? translate("sale", "admin.period.soldOut", "ขายครบโควตาแล้ว");
    case "BUDGET_EXHAUSTED":
      return translate("sale", "admin.period.endedEarly", "จบก่อนกำหนด");
    case "ENDED":
      return sale.endedAt && Date.parse(sale.endedAt) < end.getTime() ? translate("sale", "admin.period.endedEarly", "จบก่อนกำหนด") : translate("sale", "admin.period.ended", "สิ้นสุดแล้ว");
  }
}

/** มีออเดอร์ใช้ราคานี้แล้ว — `soldUnits` นับจากทุก order_item ของแคมเปญ ตรงกับ `hasOrders` ของ backend */
export function saleHasOrders(sale: Pick<AdminSale, "soldUnits">): boolean {
  return sale.soldUnits > 0;
}

/**
 * หยุดโดยแอดมิน — กติกาเดียวกับ backend: แคมเปญ Pegasus หยุดได้แค่แอดมิน ·
 * แอดมินหยุดการลดราคาของร้านต้องมีเหตุผลเสมอ ส่วนร้านหยุดเองไม่มีเหตุผล
 */
export function isPausedByAdmin(sale: Pick<AdminSale, "ownerType" | "pauseReason">): boolean {
  return sale.ownerType === "PLATFORM" || sale.pauseReason != null;
}

/** "ลด 30%" / "ลด THB 50.00/ชิ้น" / "ราคาใหม่รายชิ้น" */
export function saleDiscountLabel(sale: Pick<AdminSale, "discountType" | "discountValue">): string {
  if (sale.discountType === "PERCENT") return translate("sale", "admin.discount.percent", "ลด {percent}%", { percent: sale.discountValue ?? 0 });
  if (sale.discountType === "FIXED_OFF") return translate("sale", "admin.discount.fixedOff", "ลด {amount}/ชิ้น", { amount: formatBaht(sale.discountValue) });
  return translate("sale", "admin.discount.fixedPrice", "ราคาใหม่รายชิ้น");
}

export function saleDiscountDetail(sale: AdminSale): string {
  if (sale.discountType === "FIXED_PRICE") return translate("sale", "admin.discount.perRow", "ตั้งรายแถว");
  if (sale.ownerType === "SELLER") return translate("sale", "admin.discount.shopPays", "ร้านออกเงิน");
  if (sale.discountType === "PERCENT" && sale.maxDiscountPerUnit != null) {
    return translate("sale", "admin.discount.maxPerUnit", "สูงสุด {amount}/ชิ้น", { amount: formatBaht(sale.maxDiscountPerUnit) });
  }
  return "—";
}

/** id → ชื่อ แยกตามชนิดเพราะ id ของเกม/หมวด/ชุดการ์ดชนกันได้ */
export type SaleScopeNames = {
  games: Map<number, string>;
  categories: Map<number, string>;
  cardSets: Map<number, string>;
};

function namesFor(sale: Pick<AdminSale, "scopeType" | "scopeIds">, names: SaleScopeNames): string[] {
  const lookup =
    sale.scopeType === "GAME" ? names.games : sale.scopeType === "CATEGORY" ? names.categories : names.cardSets;
  return sale.scopeIds.map((id) => lookup.get(id)).filter((name): name is string => !!name);
}

/** "ทุกเกม" / "เกม Pokémon" / "หมวด Booster Box" / "ชุด OP-09" / "เลือก listing" */
export function saleScopeLabel(
  sale: Pick<AdminSale, "scopeType" | "scopeIds" | "ownerType" | "listingCount">,
  names: SaleScopeNames,
): string {
  switch (sale.scopeType) {
    case "ALL":
      return translate("sale", "admin.scope.all", "ทุกเกม");
    case "SHOP":
      return translate("sale", "admin.scope.shop", "ทุกสินค้าในร้าน");
    case "LISTINGS":
      return translate("sale", "admin.scope.listings", "เลือก listing");
    default: {
      const prefix = sale.scopeType === "GAME" ? translate("sale", "admin.scope.game", "เกม") : sale.scopeType === "CATEGORY" ? translate("sale", "admin.scope.category", "หมวด") : translate("sale", "admin.scope.set", "ชุด");
      const known = namesFor(sale, names);
      if (known.length === 0) return translate("sale", "admin.scope.count", "{prefix} {count} รายการ", { prefix, count: sale.scopeIds.length });
      const shown = known.slice(0, 2).join(", ");
      return known.length > 2 ? `${prefix} ${shown} +${known.length - 2}` : `${prefix} ${shown}`;
    }
  }
}

const CONDITION_SHORT: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
  SEALED: "Sealed",
};

export function conditionLabel(code: string): string {
  return CONDITION_SHORT[code] ?? code;
}

/** บรรทัดรองของคอลัมน์ขอบเขต */
export function saleScopeDetail(sale: AdminSale): string {
  if (sale.saleType === "FLASH_SALE") {
    const parts = [
      sale.perListingQuota != null ? translate("sale", "admin.scopeDetail.quota", "โควตา {quota}/listing", { quota: sale.perListingQuota }) : null,
      sale.perBuyerLimit != null ? translate("sale", "admin.scopeDetail.perBuyer", "{limit} ชิ้น/คน", { limit: sale.perBuyerLimit }) : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : translate("sale", "admin.scopeDetail.noQuota", "ไม่จำกัดโควตา");
  }
  if (sale.scopeType === "LISTINGS") return `${sale.listingCount.toLocaleString(intlLocale())} listing`;
  if (sale.scopeType === "SHOP") return translate("sale", "admin.scopeDetail.noAuction", "ไม่รวมสินค้าประมูล");
  const parts = [
    sale.conditions.length ? sale.conditions.map(conditionLabel).join(", ") : translate("sale", "admin.scopeDetail.allConditions", "ทุกสภาพ"),
    sale.minUnitPrice ? translate("sale", "admin.scopeDetail.minPrice", "ราคา ≥ {price}", { price: formatBaht(sale.minUnitPrice) }) : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** บรรทัดรองของคอลัมน์แคมเปญ */
export function saleSubtitle(sale: AdminSale): string {
  if (sale.ownerType === "SELLER") {
    return `${sale.owner?.username ?? translate("sale", "admin.type.shop", "ร้านค้า")} · ${sale.listingCount.toLocaleString(intlLocale())} listing`;
  }
  const link = sale.slug ? `/sale/${sale.slug}` : translate("sale", "admin.subtitle.noPage", "ไม่มีหน้าแคมเปญ");
  return sale.featuredOnHome ? translate("sale", "admin.subtitle.home", "{link} · หน้าแรก", { link }) : link;
}

/** % ของงบที่ใช้ไปแล้ว — ไม่มีงบคืน `null` */
export function budgetPercent(sale: Pick<AdminSale, "budgetCap" | "subsidyReserved">): number | null {
  if (!sale.budgetCap) return null;
  return Math.min(100, (100 * (sale.subsidyReserved ?? 0)) / sale.budgetCap);
}

/** ป้ายประเภทในตาราง (Figma SAL-A1): Flash / ลดทั้งหมวด / ลดทั้งชุดการ์ด / ร้านลดเอง */
export function saleTypeBadge(sale: Pick<AdminSale, "saleType" | "scopeType">): {
  type: "flash" | "percent" | "shop";
  label?: string;
} {
  if (sale.saleType === "FLASH_SALE") return { type: "flash" };
  if (sale.saleType === "SHOP_SALE") return { type: "shop" };
  return { type: "percent", label: sale.scopeType === "CARD_SET" ? translate("sale", "admin.badge.cardSet", "ลดทั้งชุดการ์ด") : translate("sale", "admin.type.category", "ลดทั้งหมวด") };
}

/**
 * ตัวอย่างการคำนวณของ listing ราคา `listPrice` (การ์ดขวาของ A2) — คิดที่หน้าเว็บเพื่อแสดงเท่านั้น
 * ราคาจริงคิดที่ server (`SalePriceResolver`) · ไม่ต่ำกว่า THB 1.00
 */
export function sampleSaleCalculation(
  input: { discountType: "PERCENT" | "FIXED_OFF"; discountValue: number | null; maxDiscountPerUnit: number | null },
  listPrice = SAMPLE_LIST_PRICE,
  commissionRate = SAMPLE_COMMISSION_RATE,
) {
  const value = Number(input.discountValue ?? 0);
  let discount = input.discountType === "PERCENT" ? Math.floor((listPrice * value) / 100) : value;
  if (input.discountType === "PERCENT" && input.maxDiscountPerUnit != null) {
    discount = Math.min(discount, input.maxDiscountPerUnit);
  }
  discount = Math.max(0, Math.min(discount, listPrice - 1));
  const buyerPays = listPrice - discount;
  // แคมเปญ Pegasus: คอมมิชชั่นคิดจากราคาตั้งต้น ร้านได้เต็ม
  const commission = Math.round(listPrice * commissionRate);
  return { listPrice, discount, buyerPays, commission, sellerReceives: listPrice - commission, subsidy: discount };
}

/** "THB 4.82M" — ยอดรวมก้อนใหญ่ในแถบผล preview */
export function compactBaht(amount: number): string {
  if (amount >= 1_000_000) return `THB ${(amount / 1_000_000).toLocaleString(intlLocale(), { maximumFractionDigits: 2 })}M`;
  if (amount >= 10_000) return `THB ${(amount / 1000).toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}K`;
  return formatBaht(amount);
}

/** ข้อความ error ของหน้าแคมเปญลดราคา แปลจาก `ApiError.code` */
export function saleErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "SALE_IN_USE")) return translate("sale", "admin.errors.inUse", "แคมเปญมีออเดอร์แล้ว ลบไม่ได้ (SALE_IN_USE) — ใช้ “จบแคมเปญ” แทน");
  if (hasErrorCode(error, "SALE_NOT_FOUND")) return translate("sale", "admin.errors.notFound", "ไม่พบแคมเปญนี้แล้ว ลองโหลดหน้าใหม่");
  if (hasErrorCode(error, "SALE_OVERLAP")) return translate("sale", "admin.errors.overlap", "listing ซ้อนกับการลดราคาอื่นช่วงเดียวกัน (SALE_OVERLAP)");
  if (hasErrorCode(error, "SALE_SLUG_TAKEN")) return translate("sale", "admin.errors.slugTaken", "ลิงก์หน้าแคมเปญนี้ถูกใช้แล้ว ลองเปลี่ยน");
  if (hasErrorCode(error, "SALE_PAUSED")) return translate("sale", "admin.errors.paused", "แคมเปญถูกหยุดโดยทีมงาน");
  if (hasErrorCode(error, "SALE_INVALID")) {
    return translate("sale", "admin.errors.invalid", "ข้อมูลแคมเปญไม่ผ่านเงื่อนไข (SALE_INVALID) — หลังมีออเดอร์แก้ได้เฉพาะชื่อ วันจบ งบ (เพิ่ม) โควตา (เพิ่ม)");
  }
  if (hasErrorCode(error, "GAME_NOT_FOUND")) return translate("sale", "admin.errors.gameNotFound", "เกมที่เลือกถูกลบไปแล้ว ลองเลือกใหม่");
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) return translate("sale", "admin.errors.categoryNotFound", "หมวดหมู่ที่เลือกถูกลบไปแล้ว ลองเลือกใหม่");
  if (hasErrorCode(error, "CARD_SET_NOT_FOUND")) return translate("sale", "admin.errors.setNotFound", "ชุดการ์ดที่เลือกถูกลบไปแล้ว ลองเลือกใหม่");
  return fallback;
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-744]
// @tolgee-key {"key": "admin.tabs.all", "ns": "sale", "defaultValue": "ทั้งหมด"}
// @tolgee-key {"key": "admin.status.ACTIVE", "ns": "sale", "defaultValue": "กำลังลด"}
// @tolgee-key {"key": "admin.status.SCHEDULED", "ns": "sale", "defaultValue": "ตั้งเวลาไว้"}
// @tolgee-key {"key": "admin.status.PAUSED", "ns": "sale", "defaultValue": "หยุดชั่วคราว"}
// @tolgee-key {"key": "admin.status.ENDED", "ns": "sale", "defaultValue": "จบแล้ว"}
// @tolgee-key {"key": "admin.type.all", "ns": "sale", "defaultValue": "ทุกประเภท"}
// @tolgee-key {"key": "admin.type.category", "ns": "sale", "defaultValue": "ลดทั้งหมวด"}
// @tolgee-key {"key": "admin.type.shop", "ns": "sale", "defaultValue": "ร้านค้า"}
// @tolgee-key {"key": "admin.status.SOLD_OUT", "ns": "sale", "defaultValue": "ขายหมด"}
// @tolgee-key {"key": "admin.status.BUDGET_EXHAUSTED", "ns": "sale", "defaultValue": "หมดงบ"}
// @tolgee-key {"key": "admin.duration.hours", "ns": "sale", "defaultValue": "ยาว {hours} ชั่วโมง"}
// @tolgee-key {"key": "admin.duration.days", "ns": "sale", "defaultValue": "ยาว {days} วัน"}
// @tolgee-key {"key": "admin.period.clockIn", "ns": "sale", "defaultValue": "{clock} · อีก {days} วัน"}
// @tolgee-key {"key": "admin.period.startsIn", "ns": "sale", "defaultValue": "เริ่มใน {days} วัน"}
// @tolgee-key {"key": "admin.period.daysLeft", "ns": "sale", "defaultValue": "เหลือ {days} วัน"}
// @tolgee-key {"key": "admin.period.pausedByAdmin", "ns": "sale", "defaultValue": "หยุดโดยแอดมิน{reason}"}
// @tolgee-key {"key": "admin.period.pausedByShop", "ns": "sale", "defaultValue": "ร้านหยุดไว้"}
// @tolgee-key {"key": "admin.period.soldOut", "ns": "sale", "defaultValue": "ขายครบโควตาแล้ว"}
// @tolgee-key {"key": "admin.period.endedEarly", "ns": "sale", "defaultValue": "จบก่อนกำหนด"}
// @tolgee-key {"key": "admin.period.ended", "ns": "sale", "defaultValue": "สิ้นสุดแล้ว"}
// @tolgee-key {"key": "admin.discount.percent", "ns": "sale", "defaultValue": "ลด {percent}%"}
// @tolgee-key {"key": "admin.discount.fixedOff", "ns": "sale", "defaultValue": "ลด {amount}/ชิ้น"}
// @tolgee-key {"key": "admin.discount.fixedPrice", "ns": "sale", "defaultValue": "ราคาใหม่รายชิ้น"}
// @tolgee-key {"key": "admin.discount.perRow", "ns": "sale", "defaultValue": "ตั้งรายแถว"}
// @tolgee-key {"key": "admin.discount.shopPays", "ns": "sale", "defaultValue": "ร้านออกเงิน"}
// @tolgee-key {"key": "admin.discount.maxPerUnit", "ns": "sale", "defaultValue": "สูงสุด {amount}/ชิ้น"}
// @tolgee-key {"key": "admin.scope.all", "ns": "sale", "defaultValue": "ทุกเกม"}
// @tolgee-key {"key": "admin.scope.shop", "ns": "sale", "defaultValue": "ทุกสินค้าในร้าน"}
// @tolgee-key {"key": "admin.scope.listings", "ns": "sale", "defaultValue": "เลือก listing"}
// @tolgee-key {"key": "admin.scope.game", "ns": "sale", "defaultValue": "เกม"}
// @tolgee-key {"key": "admin.scope.category", "ns": "sale", "defaultValue": "หมวด"}
// @tolgee-key {"key": "admin.scope.set", "ns": "sale", "defaultValue": "ชุด"}
// @tolgee-key {"key": "admin.scope.count", "ns": "sale", "defaultValue": "{prefix} {count} รายการ"}
// @tolgee-key {"key": "admin.scopeDetail.quota", "ns": "sale", "defaultValue": "โควตา {quota}/listing"}
// @tolgee-key {"key": "admin.scopeDetail.perBuyer", "ns": "sale", "defaultValue": "{limit} ชิ้น/คน"}
// @tolgee-key {"key": "admin.scopeDetail.noQuota", "ns": "sale", "defaultValue": "ไม่จำกัดโควตา"}
// @tolgee-key {"key": "admin.scopeDetail.noAuction", "ns": "sale", "defaultValue": "ไม่รวมสินค้าประมูล"}
// @tolgee-key {"key": "admin.scopeDetail.allConditions", "ns": "sale", "defaultValue": "ทุกสภาพ"}
// @tolgee-key {"key": "admin.scopeDetail.minPrice", "ns": "sale", "defaultValue": "ราคา ≥ {price}"}
// @tolgee-key {"key": "admin.subtitle.noPage", "ns": "sale", "defaultValue": "ไม่มีหน้าแคมเปญ"}
// @tolgee-key {"key": "admin.subtitle.home", "ns": "sale", "defaultValue": "{link} · หน้าแรก"}
// @tolgee-key {"key": "admin.badge.cardSet", "ns": "sale", "defaultValue": "ลดทั้งชุดการ์ด"}
// @tolgee-key {"key": "admin.errors.inUse", "ns": "sale", "defaultValue": "แคมเปญมีออเดอร์แล้ว ลบไม่ได้ (SALE_IN_USE) — ใช้ “จบแคมเปญ” แทน"}
// @tolgee-key {"key": "admin.errors.notFound", "ns": "sale", "defaultValue": "ไม่พบแคมเปญนี้แล้ว ลองโหลดหน้าใหม่"}
// @tolgee-key {"key": "admin.errors.overlap", "ns": "sale", "defaultValue": "listing ซ้อนกับการลดราคาอื่นช่วงเดียวกัน (SALE_OVERLAP)"}
// @tolgee-key {"key": "admin.errors.slugTaken", "ns": "sale", "defaultValue": "ลิงก์หน้าแคมเปญนี้ถูกใช้แล้ว ลองเปลี่ยน"}
// @tolgee-key {"key": "admin.errors.paused", "ns": "sale", "defaultValue": "แคมเปญถูกหยุดโดยทีมงาน"}
// @tolgee-key {"key": "admin.errors.invalid", "ns": "sale", "defaultValue": "ข้อมูลแคมเปญไม่ผ่านเงื่อนไข (SALE_INVALID) — หลังมีออเดอร์แก้ได้เฉพาะชื่อ วันจบ งบ (เพิ่ม) โควตา (เพิ่ม)"}
// @tolgee-key {"key": "admin.errors.gameNotFound", "ns": "sale", "defaultValue": "เกมที่เลือกถูกลบไปแล้ว ลองเลือกใหม่"}
// @tolgee-key {"key": "admin.errors.categoryNotFound", "ns": "sale", "defaultValue": "หมวดหมู่ที่เลือกถูกลบไปแล้ว ลองเลือกใหม่"}
// @tolgee-key {"key": "admin.errors.setNotFound", "ns": "sale", "defaultValue": "ชุดการ์ดที่เลือกถูกลบไปแล้ว ลองเลือกใหม่"}
