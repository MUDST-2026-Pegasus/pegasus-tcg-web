import { formatBaht, formatCount } from "./catalog.format";
import type {
  AdminOverview,
  GameShare,
  MonthlySales,
  TopSeller,
} from "./metrics.types";
import { formatMonth, formatYear, monthStart, translate } from "@/lib/i18n";

/**
 * ตัวช่วยแปลงตัวเลขจาก `/admin/metrics/overview` → ของที่การ์ดบนหน้าภาพรวมโชว์
 * ไม่มี React — ทดสอบได้ตรง ๆ
 */

/** "2026-05" → { year: 2026, month: 5 } */
function parseMonth(value: string): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

/** "2026-05" → "พ.ค." */
export function thaiMonthShort(value: string): string {
  return formatMonth(value);
}

/** "2026-08" → "สิงหาคม 2569" (ปี พ.ศ.) */
export function thaiMonthYear(value: string): string {
  return `${formatMonth(value, "long")} ${formatYear(monthStart(value))}`;
}

/** ช่วงเดือนแบบสั้น — ปีเดียวกันเขียนปีครั้งเดียว: "ม.ค. – มิ.ย. 2569" */
export function thaiMonthRange(first: string, last: string): string {
  const a = parseMonth(first);
  const b = parseMonth(last);
  if (a.year === b.year) {
    return `${thaiMonthShort(first)} – ${thaiMonthShort(last)} ${formatYear(monthStart(last))}`;
  }
  return `${thaiMonthShort(first)} ${formatYear(monthStart(first))} – ${thaiMonthShort(last)} ${formatYear(monthStart(last))}`;
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
  return percentDelta(((value - previous) / previous) * 100);
}

/** % ที่คำนวณไว้แล้ว → ป้ายบนการ์ด: ขึ้นเขียว ลงแดง ศูนย์เป็นเทา */
export function percentDelta(percent: number): Delta {
  const rounded = Number.isFinite(percent) ? Math.round(percent * 10) / 10 : 0;
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
  const { gmv, newSellers, activeListings, commission, promotionCost } = overview.stats;
  const commissionNote =
    commission.averageRatePercent === null
      ? "ยังไม่มีคำสั่งซื้อที่สำเร็จในเดือนนี้"
      : `เฉลี่ย ${commission.averageRatePercent.toFixed(1)}% ของยอดขายที่สำเร็จ`;
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
      // ต้นทุนโค้ด Pegasus ไม่หักจากค่าคอม แต่แสดงคู่กันให้เห็นว่าเดือนนี้จ่ายชดเชยร้านไปเท่าไร
      footnote:
        promotionCost.value > 0
          ? `${commissionNote} · ชดเชยโค้ด Pegasus ${formatBaht(promotionCost.value)}`
          : commissionNote,
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

// @tolgee-key {"key":"overview.export.gmv","ns":"admin","defaultValue":"ยอดขายรวม (GMV)"}
// @tolgee-key {"key":"overview.export.newSellers","ns":"admin","defaultValue":"ผู้ขายรายใหม่"}
// @tolgee-key {"key":"overview.export.activeListings","ns":"admin","defaultValue":"ประกาศขายที่เปิดอยู่"}
// @tolgee-key {"key":"overview.export.commission","ns":"admin","defaultValue":"ค่าคอมมิชชัน"}
// @tolgee-key {"key":"overview.export.promotionCost","ns":"admin","defaultValue":"ต้นทุนโปรโมชั่น (ชดเชยโค้ด Pegasus)"}
// @tolgee-key {"key":"overview.export.saleSubsidy","ns":"admin","defaultValue":"ส่วนลดแคมเปญ"}
// @tolgee-key {"key":"overview.export.liveAuctions","ns":"admin","defaultValue":"ประมูลที่กำลังเปิด"}
// @tolgee-key {"key":"overview.export.auctionSales","ns":"admin","defaultValue":"ยอดขายจากประมูล (30 วัน)"}

/**
 * แถวของไฟล์ "ส่งออกรายงาน" หน้าภาพรวม [TCG-749] — ตัวเลขดิบของเดือนที่หน้าแสดง ไม่จัดรูปแบบ
 * ค่าที่ไม่มียอดเทียบ (ประกาศที่เปิดขาย, ประมูล) เว้น `previous` ว่าง
 */
export function overviewCsvRows(overview: AdminOverview): (string | number | null)[][] {
  const s = overview.stats;
  return [
    ["metric", "value", "previous"],
    [translate("admin", "overview.export.gmv", "ยอดขายรวม (GMV)"), s.gmv.value, s.gmv.previous],
    [translate("admin", "overview.export.newSellers", "ผู้ขายรายใหม่"), s.newSellers.value, s.newSellers.previous],
    [translate("admin", "overview.export.activeListings", "ประกาศขายที่เปิดอยู่"), s.activeListings.value, null],
    [translate("admin", "overview.export.commission", "ค่าคอมมิชชัน"), s.commission.value, s.commission.previous],
    [translate("admin", "overview.export.promotionCost", "ต้นทุนโปรโมชั่น (ชดเชยโค้ด Pegasus)"), s.promotionCost.value, s.promotionCost.previous],
    [translate("admin", "overview.export.saleSubsidy", "ส่วนลดแคมเปญ"), s.saleSubsidy?.value ?? 0, s.saleSubsidy?.previous ?? 0],
    [translate("admin", "overview.export.liveAuctions", "ประมูลที่กำลังเปิด"), s.liveAuctions, null],
    [translate("admin", "overview.export.auctionSales", "ยอดขายจากประมูล (30 วัน)"), s.auctionSalesLast30Days, null],
  ];
}

/** "2026-10" → admin-overview-2026-10.csv */
export function overviewCsvFilename(overview: AdminOverview): string {
  return `admin-overview-${overview.period.month}.csv`;
}
