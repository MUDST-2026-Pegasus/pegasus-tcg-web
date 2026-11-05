import { hasErrorCode } from "@/lib/api";

import { formatBaht, formatPeriod } from "./promotions.format";
import type { AdminSale, SaleOwnerType, SaleStatus, SaleType } from "./sales.types";

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
  { value: null, label: "ทั้งหมด" },
  { value: "ACTIVE", label: "กำลังลด" },
  { value: "SCHEDULED", label: "ตั้งเวลาไว้" },
  { value: "PAUSED", label: "หยุดชั่วคราว" },
  { value: "ENDED", label: "จบแล้ว" },
];

export const SALE_TYPE_FILTERS: Array<{ value: SaleType | null; label: string }> = [
  { value: null, label: "ทุกประเภท" },
  { value: "FLASH_SALE", label: "Flash Sale" },
  { value: "CATEGORY_SALE", label: "ลดทั้งหมวด" },
  { value: "SHOP_SALE", label: "ร้านค้า" },
];

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  ACTIVE: "กำลังลด",
  SCHEDULED: "ตั้งเวลาไว้",
  PAUSED: "หยุดชั่วคราว",
  ENDED: "จบแล้ว",
  SOLD_OUT: "ขายหมด",
  BUDGET_EXHAUSTED: "หมดงบ",
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
  return owner === "PLATFORM" ? "Pegasus" : "ร้านค้า";
}

const dayMonthYear = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric" });
const dayMonth = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short" });
const time = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

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
  if (rounded <= FLASH_MAX_HOURS) return `ยาว ${rounded} ชั่วโมง`;
  return `ยาว ${Math.round(hours / 24)} วัน`;
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

const monthShort = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { month: "short" });

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
      return clock ? `${clock} · อีก ${days(start.getTime())} วัน` : `เริ่มใน ${days(start.getTime())} วัน`;
    case "ACTIVE":
      return clock ?? `เหลือ ${days(end.getTime())} วัน`;
    case "PAUSED":
      return isPausedByAdmin(sale)
        ? `หยุดโดยแอดมิน${sale.pauseReason ? ` · ${sale.pauseReason}` : ""}`
        : "ร้านหยุดไว้";
    case "SOLD_OUT":
      return clock ?? "ขายครบโควตาแล้ว";
    case "BUDGET_EXHAUSTED":
      return "จบก่อนกำหนด";
    case "ENDED":
      return sale.endedAt && Date.parse(sale.endedAt) < end.getTime() ? "จบก่อนกำหนด" : "สิ้นสุดแล้ว";
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

/** "ลด 30%" / "ลด ฿50/ชิ้น" / "ราคาใหม่รายชิ้น" */
export function saleDiscountLabel(sale: Pick<AdminSale, "discountType" | "discountValue">): string {
  if (sale.discountType === "PERCENT") return `ลด ${sale.discountValue}%`;
  if (sale.discountType === "FIXED_OFF") return `ลด ${formatBaht(sale.discountValue)}/ชิ้น`;
  return "ราคาใหม่รายชิ้น";
}

export function saleDiscountDetail(sale: AdminSale): string {
  if (sale.discountType === "FIXED_PRICE") return "ตั้งรายแถว";
  if (sale.ownerType === "SELLER") return "ร้านออกเงิน";
  if (sale.discountType === "PERCENT" && sale.maxDiscountPerUnit != null) {
    return `สูงสุด ${formatBaht(sale.maxDiscountPerUnit)}/ชิ้น`;
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
      return "ทุกเกม";
    case "SHOP":
      return "ทุกสินค้าในร้าน";
    case "LISTINGS":
      return "เลือก listing";
    default: {
      const prefix = sale.scopeType === "GAME" ? "เกม" : sale.scopeType === "CATEGORY" ? "หมวด" : "ชุด";
      const known = namesFor(sale, names);
      if (known.length === 0) return `${prefix} ${sale.scopeIds.length} รายการ`;
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
      sale.perListingQuota != null ? `โควตา ${sale.perListingQuota}/listing` : null,
      sale.perBuyerLimit != null ? `${sale.perBuyerLimit} ชิ้น/คน` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : "ไม่จำกัดโควตา";
  }
  if (sale.scopeType === "LISTINGS") return `${sale.listingCount.toLocaleString("th-TH")} listing`;
  if (sale.scopeType === "SHOP") return "ไม่รวมสินค้าประมูล";
  const parts = [
    sale.conditions.length ? sale.conditions.map(conditionLabel).join(", ") : "ทุกสภาพ",
    sale.minUnitPrice ? `ราคา ≥ ${formatBaht(sale.minUnitPrice)}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** บรรทัดรองของคอลัมน์แคมเปญ */
export function saleSubtitle(sale: AdminSale): string {
  if (sale.ownerType === "SELLER") {
    return `${sale.owner?.username ?? "ร้านค้า"} · ${sale.listingCount.toLocaleString("th-TH")} listing`;
  }
  const link = sale.slug ? `/sale/${sale.slug}` : "ไม่มีหน้าแคมเปญ";
  return sale.featuredOnHome ? `${link} · หน้าแรก` : link;
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
  return { type: "percent", label: sale.scopeType === "CARD_SET" ? "ลดทั้งชุดการ์ด" : "ลดทั้งหมวด" };
}

/**
 * ตัวอย่างการคำนวณของ listing ราคา `listPrice` (การ์ดขวาของ A2) — คิดที่หน้าเว็บเพื่อแสดงเท่านั้น
 * ราคาจริงคิดที่ server (`SalePriceResolver`) · ไม่ต่ำกว่า ฿1
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

/** "฿4.82M" — ยอดรวมก้อนใหญ่ในแถบผล preview */
export function compactBaht(amount: number): string {
  if (amount >= 1_000_000) return `฿${(amount / 1_000_000).toLocaleString("th-TH", { maximumFractionDigits: 2 })}M`;
  if (amount >= 10_000) return `฿${(amount / 1000).toLocaleString("th-TH", { maximumFractionDigits: 1 })}K`;
  return formatBaht(amount);
}

/** ข้อความ error ของหน้าแคมเปญลดราคา แปลจาก `ApiError.code` */
export function saleErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "SALE_IN_USE")) return "แคมเปญมีออเดอร์แล้ว ลบไม่ได้ (SALE_IN_USE) — ใช้ “จบแคมเปญ” แทน";
  if (hasErrorCode(error, "SALE_NOT_FOUND")) return "ไม่พบแคมเปญนี้แล้ว ลองโหลดหน้าใหม่";
  if (hasErrorCode(error, "SALE_OVERLAP")) return "listing ซ้อนกับการลดราคาอื่นช่วงเดียวกัน (SALE_OVERLAP)";
  if (hasErrorCode(error, "SALE_SLUG_TAKEN")) return "ลิงก์หน้าแคมเปญนี้ถูกใช้แล้ว ลองเปลี่ยน";
  if (hasErrorCode(error, "SALE_PAUSED")) return "แคมเปญถูกหยุดโดยทีมงาน";
  if (hasErrorCode(error, "SALE_INVALID")) {
    return "ข้อมูลแคมเปญไม่ผ่านเงื่อนไข (SALE_INVALID) — หลังมีออเดอร์แก้ได้เฉพาะชื่อ วันจบ งบ (เพิ่ม) โควตา (เพิ่ม)";
  }
  if (hasErrorCode(error, "GAME_NOT_FOUND")) return "เกมที่เลือกถูกลบไปแล้ว ลองเลือกใหม่";
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) return "หมวดหมู่ที่เลือกถูกลบไปแล้ว ลองเลือกใหม่";
  if (hasErrorCode(error, "CARD_SET_NOT_FOUND")) return "ชุดการ์ดที่เลือกถูกลบไปแล้ว ลองเลือกใหม่";
  return fallback;
}
