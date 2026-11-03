import { formatBaht, formatCount } from "./catalog.format";
import type {
  AdminOverview,
  GameShare,
  MonthlySales,
  TopSeller,
} from "./metrics.types";

/**
 * ตัวช่วยแปลงตัวเลขจาก `/admin/metrics/overview` → ของที่การ์ดบนหน้าภาพรวมโชว์
 * ไม่มี React — ทดสอบได้ตรง ๆ
 */

const THAI_MONTH_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const THAI_MONTH_LONG = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/** "2026-05" → { year: 2026, month: 5 } */
function parseMonth(value: string): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

/** "2026-05" → "พ.ค." */
export function thaiMonthShort(value: string): string {
  return THAI_MONTH_SHORT[parseMonth(value).month - 1];
}

/** "2026-08" → "สิงหาคม 2569" (ปี พ.ศ.) */
export function thaiMonthYear(value: string): string {
  const { year, month } = parseMonth(value);
  return `${THAI_MONTH_LONG[month - 1]} ${year + 543}`;
}

/** ช่วงเดือนแบบสั้น — ปีเดียวกันเขียนปีครั้งเดียว: "ม.ค. – มิ.ย. 2569" */
export function thaiMonthRange(first: string, last: string): string {
  const a = parseMonth(first);
  const b = parseMonth(last);
  if (a.year === b.year) {
    return `${thaiMonthShort(first)} – ${thaiMonthShort(last)} ${b.year + 543}`;
  }
  return `${thaiMonthShort(first)} ${a.year + 543} – ${thaiMonthShort(last)} ${b.year + 543}`;
}

export type Trend = "up" | "down" | "flat" | "new";

export type Delta = { label: string; trend: Trend };

/**
 * % เทียบช่วงก่อน — `null` เมื่อไม่มีอะไรให้เทียบ (ทั้งสองช่วงเป็น 0)
 * ช่วงก่อนเป็น 0 แต่ตอนนี้มี ใช้คำว่า "ใหม่" แทนการหารด้วยศูนย์
 */
export function formatDelta(value: number, previous: number): Delta | null {
  if (previous === 0) {
    return value === 0 ? null : { label: "ใหม่", trend: "new" };
  }
  const change = ((value - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;
  if (rounded === 0) {
    return { label: "0.0%", trend: "flat" };
  }
  const sign = rounded > 0 ? "+" : "−";
  return {
    label: `${sign}${Math.abs(rounded).toFixed(1)}%`,
    trend: rounded > 0 ? "up" : "down",
  };
}

/** ความสูงแท่ง sparkline ของ StatCard (px) — แท่งสูงสุดเต็มกรอบ, ศูนย์ยังเห็นเป็นเส้นบาง */
export const SPARK_HEIGHT = 26;
const SPARK_MIN = 2;

export function sparkBars(values: number[], maxHeight = SPARK_HEIGHT): number[] {
  const peak = Math.max(0, ...values);
  if (peak === 0) {
    return values.map(() => SPARK_MIN);
  }
  return values.map((value) =>
    Math.max(SPARK_MIN, Math.round((value / peak) * maxHeight)),
  );
}

export type StatAccent = "primary" | "teal" | "green";

export type StatCardModel = {
  id: string;
  label: string;
  value: string;
  delta: Delta | null;
  footnote: string;
  /** `null` = ตัวเลขนี้ไม่มีประวัติรายสัปดาห์ (ประกาศที่ใช้งานอยู่) */
  bars: number[] | null;
  accent: StatAccent;
};

/** การ์ดสถิติ 4 ใบเรียงตามดีไซน์ */
export function statCards(overview: AdminOverview): StatCardModel[] {
  const { gmv, newSellers, activeListings, commission } = overview.stats;
  return [
    {
      id: "gmv",
      label: "ยอดขายรวมเดือนนี้",
      value: formatBaht(gmv.value),
      delta: formatDelta(gmv.value, gmv.previous),
      footnote: `เทียบกับ ${formatBaht(gmv.previous)} เดือนก่อน`,
      bars: sparkBars(gmv.sparkline),
      accent: "primary",
    },
    {
      id: "new-sellers",
      label: "ผู้ขายรายใหม่",
      value: formatCount(newSellers.value),
      delta: formatDelta(newSellers.value, newSellers.previous),
      footnote: "ผ่านการยืนยันตัวตนแล้ว",
      bars: sparkBars(newSellers.sparkline),
      accent: "teal",
    },
    {
      id: "active-listings",
      label: "ประกาศขายที่ใช้งานอยู่",
      value: formatCount(activeListings.value),
      delta: null,
      footnote: `จาก ${formatCount(activeListings.sellerCount)} ร้านค้าทั่วแพลตฟอร์ม`,
      bars: null,
      accent: "primary",
    },
    {
      id: "commission",
      label: "ค่าคอมมิชชั่นที่เก็บได้",
      value: formatBaht(commission.value),
      delta: formatDelta(commission.value, commission.previous),
      footnote:
        commission.averageRatePercent === null
          ? "ยังไม่มีคำสั่งซื้อที่สำเร็จในเดือนนี้"
          : `เฉลี่ย ${commission.averageRatePercent.toFixed(1)}% ของยอดขายที่สำเร็จ`,
      bars: sparkBars(commission.sparkline),
      accent: "green",
    },
  ];
}

export type SalesPoint = { month: string; singles: number; sealed: number };

/** แกน X ของกราฟใช้ชื่อเดือนย่อภาษาไทย */
export function salesPoints(trend: MonthlySales[]): SalesPoint[] {
  return trend.map((point) => ({
    month: thaiMonthShort(point.month),
    singles: point.singles,
    sealed: point.sealed,
  }));
}

export function salesTrendDescription(trend: MonthlySales[]): string {
  if (trend.length === 0) {
    return "ยอดขายรวมรายเดือน (บาท)";
  }
  return `ยอดขายรวม ${thaiMonthRange(trend[0].month, trend[trend.length - 1].month)} (บาท)`;
}

export type TopSellerBar = {
  id: number;
  name: string;
  amount: string;
  /** เทียบกับอันดับ 1 (= 100) */
  percent: number;
};

export function topSellerBars(sellers: TopSeller[]): TopSellerBar[] {
  const top = sellers[0]?.amount ?? 0;
  return sellers.map((seller) => ({
    id: seller.sellerProfileId,
    name: seller.username,
    amount: formatBaht(seller.amount),
    percent: top > 0 ? Math.round((seller.amount / top) * 100) : 0,
  }));
}

export type GameSlice = { id: string; name: string; value: number };

export function gameSlices(shares: GameShare[]): GameSlice[] {
  return shares.map((share) => ({
    id: share.others ? "others" : `game-${share.gameId}`,
    name: share.others ? "อื่น ๆ" : (share.gameName ?? "ไม่ระบุเกม"),
    value: share.percent,
  }));
}

/** "Pokémon ครองส่วนแบ่ง 46%" จากชิ้นใหญ่สุด — ชิ้น "อื่น ๆ" ไม่นับเป็นผู้นำ */
export function gameShareHeadline(shares: GameShare[]): string | null {
  const leader = shares.find((share) => !share.others);
  if (!leader) {
    return null;
  }
  const percent = Number.isInteger(leader.percent)
    ? leader.percent.toString()
    : leader.percent.toFixed(1);
  return `${leader.gameName ?? "ไม่ระบุเกม"} ครองส่วนแบ่ง ${percent}%`;
}
