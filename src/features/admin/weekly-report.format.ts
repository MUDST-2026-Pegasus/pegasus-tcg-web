import { addDays, format, parseISO, startOfWeek } from "date-fns";

import { formatCount } from "./catalog.format";
import {
  percentDelta,
  sparkBars,
  type Delta,
  type StatCardModel,
} from "./metrics.format";
import type {
  WeeklyProductType,
  WeeklyReport,
  WeeklyStockStatus,
} from "./weekly-report.types";
import { formatDate, formatMonth, formatYear, intlLocale, monthStart, translate } from "@/lib/i18n";

/**
 * ตัวช่วยของหน้ารายงานสต็อกและกำไรรายสัปดาห์ ไม่มี React — ทดสอบได้ตรง ๆ
 * วันที่ทั้งหมดเป็นสตริง "YYYY-MM-DD" ตามปฏิทินไทย ไม่พึ่งเขตเวลาของเครื่องผู้ใช้
 */

const ISO_DATE = "yyyy-MM-dd";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 428500 → "฿428,500" ตามดีไซน์ ยอดที่มีสตางค์คงไว้ 2 ตำแหน่ง ตัวเลขจะได้ตรงกับ API */
export function formatReportBaht(amount: number): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const toIso = (date: Date) => format(date, ISO_DATE);

/** วันนี้ตามเวลาไทย ไม่ว่าเครื่องผู้ใช้จะตั้งเขตเวลาไหน */
export function bangkokToday(now: Date = new Date()): string {
  // ไม่ขึ้นกับภาษา: en-CA ได้รูป YYYY-MM-DD สำหรับส่ง API
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
  const [, , day] = date.split("-").map(Number);
  return { year: formatYear(monthStart(date.slice(0, 7))), day, monthShort: formatMonth(date.slice(0, 7)) };
}

/** "3 - 9 ส.ค. 2569" / "27 ก.ค. - 2 ส.ค. 2569" / "29 ธ.ค. 2568 - 4 ม.ค. 2569" */
export function weekRangeLabel(weekStart: string): string {
  const a = splitDate(weekStart);
  const b = splitDate(weekEnd(weekStart));
  if (a.year !== b.year) {
    return `${a.day} ${a.monthShort} ${a.year} - ${b.day} ${b.monthShort} ${b.year}`;
  }
  if (a.monthShort !== b.monthShort) {
    return `${a.day} ${a.monthShort} - ${b.day} ${b.monthShort} ${b.year}`;
  }
  return `${a.day} - ${b.day} ${b.monthShort} ${b.year}`;
}

export type WeekOption = { weekStart: string; label: string; range: string };

/** ตัวเลือกในเมนูสัปดาห์ เรียงตามดีไซน์ — สัปดาห์หน้าเลือกได้ แต่ยังไม่มีข้อมูล */
export function weekOptions(today: string): WeekOption[] {
  const current = weekStartOf(today);
  return [
    {
      weekStart: current,
      label: translate("admin", "weeklyReport.filter.currentWeek", "สัปดาห์ปัจจุบัน"),
    },
    {
      weekStart: addWeeks(current, -1),
      label: translate("admin", "weeklyReport.filter.previousWeek", "สัปดาห์ก่อนหน้า"),
    },
    {
      weekStart: addWeeks(current, -2),
      label: translate("admin", "weeklyReport.filter.twoWeeksAgo", "2 สัปดาห์ก่อน"),
    },
    {
      weekStart: addWeeks(current, 1),
      label: translate("admin", "weeklyReport.filter.nextWeekNoData", "สัปดาห์หน้า (ไม่มีข้อมูล)"),
    },
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
    translate("admin", "weeklyReport.stat.stockSingles", "การ์ดเดี่ยว {count}", {
      count: formatCount(totals.singleCards),
    }),
    translate("admin", "weeklyReport.stat.stockSealed", "กล่อง/ซองสุ่ม {count}", {
      count: formatCount(totals.sealedBoxes),
    }),
    ...(totals.otherItems > 0
      ? [
          translate("admin", "weeklyReport.stat.stockOther", "อื่น ๆ {count}", {
            count: formatCount(totals.otherItems),
          }),
        ]
      : []),
  ].join(" · ");
  const commissionShare = summary.gmv > 0 ? (summary.commission / summary.gmv) * 100 : 0;

  return [
    {
      id: "net-profit",
      label: translate("admin", "weeklyReport.stat.netProfit", "กำไรสุทธิสัปดาห์นี้"),
      value: formatReportBaht(summary.netProfit),
      delta: delta(summary.netProfit, previous?.summary.netProfit),
      footnote: !hasData
        ? translate("admin", "weeklyReport.stat.netProfitNoOrders", "ไม่มีรายการคำสั่งซื้อในสัปดาห์ที่เลือก")
        : previous
          ? translate(
              "admin",
              "weeklyReport.stat.netProfitFootnoteCompared",
              "รายได้ค่าคอมมิชชั่นของแพลตฟอร์ม (เทียบ {amount} สัปดาห์ก่อน)",
              { amount: formatReportBaht(previous.summary.netProfit) },
            )
          : translate("admin", "weeklyReport.stat.netProfitFootnote", "รายได้ค่าคอมมิชชั่นของแพลตฟอร์ม"),
      bars: sparkBars(history.map((day) => day.netProfit)),
      accent: "primary",
    },
    {
      id: "gmv",
      label: translate("admin", "weeklyReport.stat.gmv", "ยอดขายรวมรายสัปดาห์"),
      value: formatReportBaht(summary.gmv),
      delta: percentDelta(summary.wowChangePercent),
      footnote: translate(
        "admin",
        "weeklyReport.stat.gmvFootnote",
        "จากคำสั่งซื้อที่สำเร็จแล้ว {count} รายการ",
        { count: formatCount(summary.soldCount) },
      ),
      bars: sparkBars(history.map((day) => day.gmv)),
      accent: "primary",
    },
    {
      id: "stock",
      label: translate("admin", "weeklyReport.stat.stock", "สต็อกที่เปิดขายอยู่"),
      value: formatCount(summary.remainingStock),
      delta: delta(summary.remainingStock, previous?.summary.remainingStock),
      footnote: stockSplit,
      // วันที่ยังมาไม่ถึงไม่มีสต็อกสิ้นวัน ให้เป็นแท่งเตี้ยสุด
      bars: sparkBars(history.map((day) => day.remainingStock ?? 0)),
      accent: "primary",
    },
    {
      id: "commission",
      label: translate("admin", "weeklyReport.stat.commission", "ค่าคอมมิชชั่นที่เก็บได้"),
      value: formatReportBaht(summary.commission),
      delta: delta(summary.commission, previous?.summary.commission),
      footnote: translate(
        "admin",
        "weeklyReport.stat.commissionFootnote",
        "{prefix} {share}% ของยอดขายรวมรายสัปดาห์",
        {
          prefix: hasData
            ? translate("admin", "weeklyReport.stat.isShare", "คิดเป็น")
            : translate("admin", "weeklyReport.stat.avgShare", "เฉลี่ย"),
          share: commissionShare.toFixed(1),
        },
      ),
      bars: sparkBars(history.map((day) => day.commission)),
      accent: "primary",
    },
  ];
}

export type WeeklyTrendPoint = { day: string; singles: number; sealed: number; other: number };

export function weeklyTrendPoints(report: WeeklyReport): WeeklyTrendPoint[] {
  return report.chartData.map(({ date, singles, sealed, other }) => ({
    day: formatDate(parseISO(date), { weekday: "short" }),
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

export const PRODUCT_TYPE_LABEL: Record<WeeklyProductType, string> = {
  get SINGLE_CARD() {
    return translate("admin", "weeklyReport.productType.singleCard", "การ์ดเดี่ยว");
  },
  get SEALED() {
    return translate("admin", "weeklyReport.productType.sealed", "กล่อง/ซองสุ่ม");
  },
  get OTHER() {
    return translate("admin", "weeklyReport.productType.other", "อื่น ๆ");
  },
};

export const STOCK_STATUS_LABEL: Record<WeeklyStockStatus, string> = {
  get NORMAL() {
    return translate("admin", "weeklyReport.stockStatus.normal", "ปกติ");
  },
  get FAST_MOVING() {
    return translate("admin", "weeklyReport.stockStatus.fastMoving", "สต็อกหมุนเวียนเร็ว");
  },
  get LOW_STOCK() {
    return translate("admin", "weeklyReport.stockStatus.lowStock", "สต็อกต่ำ");
  },
};

/** สีตามลำดับในดีไซน์ เกมเกินจากนี้ไล่สีกราฟของระบบต่อ */
export const GAME_COLORS = [
  "var(--primary)",
  "#38bdf8",
  "#cbd5e1",
  "var(--chart-3)",
  "var(--chart-5)",
];

// @tolgee-key {"key":"weeklyReport.filter.currentWeek","ns":"admin","defaultValue":"สัปดาห์ปัจจุบัน"}
// @tolgee-key {"key":"weeklyReport.filter.previousWeek","ns":"admin","defaultValue":"สัปดาห์ก่อนหน้า"}
// @tolgee-key {"key":"weeklyReport.filter.twoWeeksAgo","ns":"admin","defaultValue":"2 สัปดาห์ก่อน"}
// @tolgee-key {"key":"weeklyReport.filter.nextWeekNoData","ns":"admin","defaultValue":"สัปดาห์หน้า (ไม่มีข้อมูล)"}
// @tolgee-key {"key":"weeklyReport.stat.netProfit","ns":"admin","defaultValue":"กำไรสุทธิสัปดาห์นี้"}
// @tolgee-key {"key":"weeklyReport.stat.netProfitNoOrders","ns":"admin","defaultValue":"ไม่มีรายการคำสั่งซื้อในสัปดาห์ที่เลือก"}
// @tolgee-key {"key":"weeklyReport.stat.netProfitFootnoteCompared","ns":"admin","defaultValue":"รายได้ค่าคอมมิชชั่นของแพลตฟอร์ม (เทียบ {amount} สัปดาห์ก่อน)"}
// @tolgee-key {"key":"weeklyReport.stat.netProfitFootnote","ns":"admin","defaultValue":"รายได้ค่าคอมมิชชั่นของแพลตฟอร์ม"}
// @tolgee-key {"key":"weeklyReport.stat.gmv","ns":"admin","defaultValue":"ยอดขายรวมรายสัปดาห์"}
// @tolgee-key {"key":"weeklyReport.stat.gmvFootnote","ns":"admin","defaultValue":"จากคำสั่งซื้อที่สำเร็จแล้ว {count} รายการ"}
// @tolgee-key {"key":"weeklyReport.stat.stock","ns":"admin","defaultValue":"สต็อกที่เปิดขายอยู่"}
// @tolgee-key {"key":"weeklyReport.stat.stockSingles","ns":"admin","defaultValue":"การ์ดเดี่ยว {count}"}
// @tolgee-key {"key":"weeklyReport.stat.stockSealed","ns":"admin","defaultValue":"กล่อง/ซองสุ่ม {count}"}
// @tolgee-key {"key":"weeklyReport.stat.stockOther","ns":"admin","defaultValue":"อื่น ๆ {count}"}
// @tolgee-key {"key":"weeklyReport.stat.commission","ns":"admin","defaultValue":"ค่าคอมมิชชั่นที่เก็บได้"}
// @tolgee-key {"key":"weeklyReport.stat.commissionFootnote","ns":"admin","defaultValue":"{prefix} {share}% ของยอดขายรวมรายสัปดาห์"}
// @tolgee-key {"key":"weeklyReport.stat.isShare","ns":"admin","defaultValue":"คิดเป็น"}
// @tolgee-key {"key":"weeklyReport.stat.avgShare","ns":"admin","defaultValue":"เฉลี่ย"}
// @tolgee-key {"key":"weeklyReport.productType.singleCard","ns":"admin","defaultValue":"การ์ดเดี่ยว"}
// @tolgee-key {"key":"weeklyReport.productType.sealed","ns":"admin","defaultValue":"กล่อง/ซองสุ่ม"}
// @tolgee-key {"key":"weeklyReport.productType.other","ns":"admin","defaultValue":"อื่น ๆ"}
// @tolgee-key {"key":"weeklyReport.stockStatus.normal","ns":"admin","defaultValue":"ปกติ"}
// @tolgee-key {"key":"weeklyReport.stockStatus.fastMoving","ns":"admin","defaultValue":"สต็อกหมุนเวียนเร็ว"}
// @tolgee-key {"key":"weeklyReport.stockStatus.lowStock","ns":"admin","defaultValue":"สต็อกต่ำ"}
