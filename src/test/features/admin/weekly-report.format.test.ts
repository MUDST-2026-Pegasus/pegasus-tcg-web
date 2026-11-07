import { describe, expect, it } from "vitest";

import {
  bangkokToday,
  compactBaht,
  formatReportBaht,
  formatShare,
  resolveWeekParam,
  weekEnd,
  weekOptions,
  weekRangeLabel,
  weeklyStatCards,
  weeklyTrendPoints,
  weekStartOf,
} from "@/features/admin/weekly-report.format";
import type { WeeklyReport } from "@/features/admin/weekly-report.types";

function report(overrides: Partial<WeeklyReport> = {}): WeeklyReport {
  return {
    startDate: "2026-08-03",
    endDate: "2026-08-09",
    hasData: true,
    meta: {
      startDate: "2026-08-03",
      endDate: "2026-08-09",
      timezone: "Asia/Bangkok",
      gameCategory: null,
      productType: null,
      commissionRatePercent: 3,
    },
    summary: {
      gmv: 428500,
      weeklyGmv: 428500,
      commission: 12855,
      commissionCollected: 12855,
      netProfit: 12855,
      initialStock: 7654,
      soldCount: 1470,
      remainingStock: 6184,
      stockDepleted: 1470,
      wowChangePercent: 18.2,
    },
    chartData: [
      { date: "2026-08-03", singles: 100, sealed: 50, other: 0 },
      { date: "2026-08-09", singles: 300, sealed: 100, other: 25 },
    ],
    kpiHistory: [
      { date: "2026-08-03", gmv: 150, netProfit: 10, commission: 5, remainingStock: 6000 },
      { date: "2026-08-09", gmv: 425, netProfit: 40, commission: 13, remainingStock: null },
    ],
    gameDistribution: [],
    breakdownByGameAndType: [],
    totals: {
      initialStock: 7654,
      soldCount: 1470,
      remainingStock: 6184,
      singleCards: 4500,
      sealedBoxes: 1684,
      otherItems: 0,
      gmv: 428500,
      weeklyGmv: 428500,
      commission: 12855,
      commissionCollected: 12855,
      netProfit: 12855,
    },
    ...overrides,
  };
}

describe("week helpers", () => {
  it("resolves any day to its Monday-to-Sunday week", () => {
    expect(weekStartOf("2026-08-03")).toBe("2026-08-03");
    expect(weekStartOf("2026-08-09")).toBe("2026-08-03");
    expect(weekEnd("2026-08-03")).toBe("2026-08-09");
  });

  it("uses the Bangkok calendar day regardless of the machine timezone", () => {
    expect(bangkokToday(new Date("2026-08-09T17:30:00Z"))).toBe("2026-08-10");
  });

  it("falls back to the current week for an unreadable ?week=", () => {
    expect(resolveWeekParam("2026-08-05", "2026-11-07")).toBe("2026-08-03");
    expect(resolveWeekParam("not-a-date", "2026-11-07")).toBe("2026-11-02");
    expect(resolveWeekParam("2026-13-45", "2026-11-07")).toBe("2026-11-02");
    expect(resolveWeekParam(null, "2026-11-07")).toBe("2026-11-02");
  });

  it("labels weeks in the Buddhist era, shortening repeats", () => {
    expect(weekRangeLabel("2026-08-03")).toBe("3 - 9 ส.ค. 2569");
    expect(weekRangeLabel("2026-07-27")).toBe("27 ก.ค. - 2 ส.ค. 2569");
    expect(weekRangeLabel("2025-12-29")).toBe("29 ธ.ค. 2568 - 4 ม.ค. 2569");
  });

  it("offers current, two past and next weeks", () => {
    expect(weekOptions("2026-08-05").map((option) => option.range)).toEqual([
      "3 - 9 ส.ค. 2569",
      "27 ก.ค. - 2 ส.ค. 2569",
      "20 - 26 ก.ค. 2569",
      "10 - 16 ส.ค. 2569",
    ]);
  });
});

describe("weeklyStatCards", () => {
  const byId = (cards: ReturnType<typeof weeklyStatCards>, id: string) =>
    cards.find((card) => card.id === id)!;

  it("shows API figures and compares against the previous week", () => {
    const previous = report();
    previous.summary = { ...previous.summary, netProfit: 10875, remainingStock: 6000, commission: 10875 };
    const cards = weeklyStatCards(report(), previous);

    expect(byId(cards, "net-profit").value).toBe("฿12,855");
    expect(byId(cards, "net-profit").delta).toEqual({ label: "+18.2%", trend: "up" });
    expect(byId(cards, "net-profit").footnote).toContain("฿10,875");
    expect(byId(cards, "gmv").value).toBe("฿428,500");
    expect(byId(cards, "gmv").delta).toEqual({ label: "+18.2%", trend: "up" });
    expect(byId(cards, "stock").value).toBe("6,184");
    expect(byId(cards, "stock").delta).toEqual({ label: "+3.1%", trend: "up" });
    expect(byId(cards, "stock").footnote).toBe("การ์ดเดี่ยว 4,500 · กล่อง/ซองสุ่ม 1,684");
    expect(byId(cards, "commission").footnote).toBe("คิดเป็น 3.0% ของยอดขายรวมรายสัปดาห์");
  });

  it("marks a falling figure as down", () => {
    const current = report();
    current.summary = { ...current.summary, wowChangePercent: -12.5 };
    expect(byId(weeklyStatCards(current, undefined), "gmv").delta).toEqual({
      label: "−12.5%",
      trend: "down",
    });
  });

  it("draws every sparkline from the API's daily history", () => {
    const cards = weeklyStatCards(report(), undefined);
    expect(byId(cards, "net-profit").bars).toEqual([7, 26]);
    expect(byId(cards, "gmv").bars).toEqual([9, 26]);
    expect(byId(cards, "commission").bars).toEqual([10, 26]);
    // วันที่ยังมาไม่ถึงไม่มีสต็อกสิ้นวัน
    expect(byId(cards, "stock").bars).toEqual([26, 2]);
  });

  it("lists other items in the stock split only when there are some", () => {
    const current = report();
    current.totals = { ...current.totals, otherItems: 12 };
    expect(byId(weeklyStatCards(current, undefined), "stock").footnote).toBe(
      "การ์ดเดี่ยว 4,500 · กล่อง/ซองสุ่ม 1,684 · อื่น ๆ 12",
    );
  });

  it("hides comparisons until the previous week is known", () => {
    const cards = weeklyStatCards(report(), undefined);
    expect(byId(cards, "net-profit").delta).toBeNull();
    expect(byId(cards, "net-profit").footnote).toBe("หักค่าธรรมเนียมระบบแล้ว");
  });

  it("never renders NaN for an empty week", () => {
    const empty = report({
      hasData: false,
      summary: {
        gmv: 0, weeklyGmv: 0, commission: 0, commissionCollected: 0, netProfit: 0,
        initialStock: 0, soldCount: 0, remainingStock: 0, stockDepleted: 0, wowChangePercent: 0,
      },
      chartData: [{ date: "2026-08-10", singles: 0, sealed: 0, other: 0 }],
      kpiHistory: [{ date: "2026-08-10", gmv: 0, netProfit: 0, commission: 0, remainingStock: 0 }],
      totals: {
        initialStock: 0, soldCount: 0, remainingStock: 0, singleCards: 0, sealedBoxes: 0, otherItems: 0,
        gmv: 0, weeklyGmv: 0, commission: 0, commissionCollected: 0, netProfit: 0,
      },
    });
    const cards = weeklyStatCards(empty, report());

    expect(JSON.stringify(cards)).not.toMatch(/NaN|undefined|Infinity/);
    expect(cards.every((card) => card.delta?.label === "0.0%")).toBe(true);
    expect(byId(cards, "commission").footnote).toBe("เฉลี่ย 0.0% ของยอดขายรวมรายสัปดาห์");
    expect(byId(cards, "net-profit").footnote).toBe("ไม่มีรายการคำสั่งซื้อในสัปดาห์ที่เลือก");
  });
});

describe("small formatters", () => {
  it("maps dates to Thai weekdays", () => {
    expect(weeklyTrendPoints(report()).map((point) => point.day)).toEqual(["จ.", "อา."]);
  });

  it("drops satang only when there is none, so figures still match the API", () => {
    expect(formatReportBaht(428500)).toBe("฿428,500");
    expect(formatReportBaht(12855.5)).toBe("฿12,855.50");
    expect(formatReportBaht(0)).toBe("฿0");
  });

  it("formats shares without NaN", () => {
    expect(formatShare(56)).toBe("56%");
    expect(formatShare(56.42)).toBe("56.4%");
    expect(formatShare(83.96)).toBe("84%");
    expect(formatShare(Number.NaN)).toBe("0%");
    expect(formatShare(null)).toBe("0%");
  });

  it("compacts axis ticks", () => {
    expect(compactBaht(0)).toBe("0");
    expect(compactBaht(20000)).toBe("20k");
    expect(compactBaht(2500)).toBe("2.5k");
  });

});
