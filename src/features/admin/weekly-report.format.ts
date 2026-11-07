import { translate } from "@/lib/language";
import { addDays, format, parseISO, startOfWeek } from "date-fns";

import { formatCount } from "./catalog.format";
import {
  percentDelta,
  sparkBars,
  thaiMonthShort,
  type Delta,
  type StatCardModel,
} from "./metrics.format";
import type { WeeklyReport, WeeklyStockStatus } from "./weekly-report.types";

/**
 * ตัวช่วยของหน้ารายงานสต็อกและกำไรรายสัปดาห์ ไม่มี React — ทดสอบได้ตรง ๆ
 * วันที่ทั้งหมดเป็นสตริง "YYYY-MM-DD" ตามปฏิทินไทย ไม่พึ่งเขตเวลาของเครื่องผู้ใช้
 */

const ISO_DATE = "yyyy-MM-dd";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 428500 → "฿428,500" ตามดีไซน์ ยอดที่มีสตางค์คงไว้ 2 ตำแหน่ง ตัวเลขจะได้ตรงกับ API */
export function formatReportBaht(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const toIso = (date: Date) => format(date, ISO_DATE);

/** วันนี้ตามเวลาไทย ไม่ว่าเครื่องผู้ใช้จะตั้งเขตเวลาไหน */
export function bangkokToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** วันจันทร์ของสัปดาห์ที่วันนั้นอยู่ */
export function weekStartOf(date: string): string {
  return toIso(startOfWeek(parseISO(date), { weekStartsOn: 1 }));
}

export function addWeeks(weekStart: string, weeks: number): string {
  return toIso(addDays(parseISO(weekStart), weeks * 7));
}

/** วันอาทิตย์ของสัปดาห์ */
export function weekEnd(weekStart: string): string {
  return toIso(addDays(parseISO(weekStart), 6));
}

/** ค่า `?week=` จาก URL → วันจันทร์ ค่าที่อ่านไม่ได้ใช้สัปดาห์ปัจจุบันแทน */
export function resolveWeekParam(value: string | null, today: string): string {
  if (value && ISO_DATE_PATTERN.test(value) && !Number.isNaN(parseISO(value).getTime())) {
    return weekStartOf(value);
  }
  return weekStartOf(today);
}

function splitDate(date: string) {
  const [year, , day] = date.split("-").map(Number);
  return { year, day, monthShort: thaiMonthShort(date.slice(0, 7)) };
}

/** "3 - 9 ส.ค. 2569" / "27 ก.ค. - 2 ส.ค. 2569" / "29 ธ.ค. 2568 - 4 ม.ค. 2569" */
export function weekRangeLabel(weekStart: string): string {
  const a = splitDate(weekStart);
  const b = splitDate(weekEnd(weekStart));
  if (a.year !== b.year) {
    return `${a.day} ${a.monthShort} ${a.year + 543} - ${b.day} ${b.monthShort} ${b.year + 543}`;
  }
  if (a.monthShort !== b.monthShort) {
    return `${a.day} ${a.monthShort} - ${b.day} ${b.monthShort} ${b.year + 543}`;
  }
  return `${a.day} - ${b.day} ${b.monthShort} ${b.year + 543}`;
}

export type WeekOption = { weekStart: string; label: string; range: string };

/** ตัวเลือกในเมนูสัปดาห์ เรียงตามดีไซน์ — สัปดาห์หน้าเลือกได้ แต่ยังไม่มีข้อมูล */
export function weekOptions(today: string): WeekOption[] {
  const current = weekStartOf(today);
  return [
    { weekStart: current, label: "สัปดาห์ปัจจุบัน" },
    { weekStart: addWeeks(current, -1), label: "สัปดาห์ก่อนหน้า" },
    { weekStart: addWeeks(current, -2), label: "2 สัปดาห์ก่อน" },
    { weekStart: addWeeks(current, 1), label: "สัปดาห์หน้า (ไม่มีข้อมูล)" },
  ].map((option) => ({ ...option, range: weekRangeLabel(option.weekStart) }));
}

/** 56 → "56%", 56.42 → "56.4%", 83.96 → "84%" — ค่าเสียหายไม่ออกเป็น NaN% */
export function formatShare(percent: number | null | undefined): string {
  const value = Number.isFinite(percent) ? Number(percent) : 0;
  return `${Number(value.toFixed(1))}%`;
}

/**
 * เทียบกับสัปดาห์ก่อนตามกติกาเดียวกับ `percentChange` ฝั่ง backend
 * (สัปดาห์ก่อนเป็น 0 ถือว่า 0.0%) — `undefined` = ยังไม่รู้ค่าสัปดาห์ก่อน ไม่โชว์ป้าย
 */
function changeFrom(value: number, previous: number | undefined): Delta | null {
  if (previous === undefined) {
    return null;
  }
  return percentDelta(previous === 0 ? 0 : ((value - previous) / previous) * 100);
}

/** การ์ด 4 ใบตามดีไซน์ — `previous` คือรายงานของสัปดาห์ก่อนด้วยตัวกรองเดียวกัน */
export function weeklyStatCards(
  report: WeeklyReport,
  previous: WeeklyReport | undefined,
): StatCardModel[] {
  const { summary, totals, hasData } = report;
  const flat = percentDelta(0);
  const delta = (value: number, last: number | undefined) =>
    hasData ? changeFrom(value, last) : flat;
  const history = report.kpiHistory;
  const stockSplit = [
    `การ์ดเดี่ยว ${formatCount(totals.singleCards)}`,
    `กล่อง/ซองสุ่ม ${formatCount(totals.sealedBoxes)}`,
    ...(totals.otherItems > 0 ? [`อื่น ๆ ${formatCount(totals.otherItems)}`] : []),
  ].join(" · ");
  const commissionShare = summary.gmv > 0 ? (summary.commission / summary.gmv) * 100 : 0;

  return [
    {
      id: "net-profit",
      label: "กำไรสุทธิสัปดาห์นี้",
      value: formatReportBaht(summary.netProfit),
      delta: delta(summary.netProfit, previous?.summary.netProfit),
      footnote: !hasData
        ? "ไม่มีรายการคำสั่งซื้อในสัปดาห์ที่เลือก"
        : previous
          ? `หักค่าธรรมเนียมระบบแล้ว (เทียบ ${formatReportBaht(previous.summary.netProfit)} สัปดาห์ก่อน)`
          : "หักค่าธรรมเนียมระบบแล้ว",
      bars: sparkBars(history.map((day) => day.netProfit)),
      accent: "primary",
    },
    {
      id: "gmv",
      label: "ยอดขายรวมรายสัปดาห์",
      value: formatReportBaht(summary.gmv),
      delta: percentDelta(summary.wowChangePercent),
      footnote: `จากคำสั่งซื้อที่สำเร็จแล้ว ${formatCount(summary.soldCount)} รายการ`,
      bars: sparkBars(history.map((day) => day.gmv)),
      accent: "primary",
    },
    {
      id: "stock",
      label: "สต็อกที่เปิดขายอยู่",
      value: formatCount(summary.remainingStock),
      delta: delta(summary.remainingStock, previous?.summary.remainingStock),
      footnote: stockSplit,
      // วันที่ยังมาไม่ถึงไม่มีสต็อกสิ้นวัน ให้เป็นแท่งเตี้ยสุด
      bars: sparkBars(history.map((day) => day.remainingStock ?? 0)),
      accent: "primary",
    },
    {
      id: "commission",
      label: translate("ค่าคอมมิชชั่นที่เก็บได้", "Commission collected"),
      value: formatReportBaht(summary.commission),
      delta: delta(summary.commission, previous?.summary.commission),
      footnote: `${hasData ? "คิดเป็น" : "เฉลี่ย"} ${commissionShare.toFixed(1)}% ของยอดขายรวมรายสัปดาห์`,
      bars: sparkBars(history.map((day) => day.commission)),
      accent: "primary",
    },
  ];
}

const WEEKDAY_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export type WeeklyTrendPoint = { day: string; singles: number; sealed: number; other: number };

export function weeklyTrendPoints(report: WeeklyReport): WeeklyTrendPoint[] {
  return report.chartData.map(({ date, singles, sealed, other }) => ({
    day: WEEKDAY_SHORT[parseISO(date).getDay()],
    singles,
    sealed,
    other,
  }));
}

/** แกน Y: 20000 → "20k" */
export function compactBaht(value: number): string {
  return value >= 1000 ? `${Number((value / 1000).toFixed(1))}k` : String(value);
}

export const STOCK_STATUS_BADGE: Record<WeeklyStockStatus, string> = {
  NORMAL: "bg-[#dcfce7] text-[#10b981]",
  FAST_MOVING: "bg-[#e0f2fe] text-primary",
  LOW_STOCK: "bg-[#fef3c7] text-[#f59e0b]",
};

/** สีตามลำดับในดีไซน์ เกมเกินจากนี้ไล่สีกราฟของระบบต่อ */
export const GAME_COLORS = [
  "var(--primary)",
  "#38bdf8",
  "#cbd5e1",
  "var(--chart-3)",
  "var(--chart-5)",
];
