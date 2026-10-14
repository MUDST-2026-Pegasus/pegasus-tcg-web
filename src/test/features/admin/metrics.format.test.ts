import { describe, expect, it } from "vitest";

import {
  formatDelta,
  gameShareHeadline,
  gameSlices,
  salesTrendDescription,
  sparkBars,
  statCards,
  thaiMonthRange,
  thaiMonthShort,
  thaiMonthYear,
  topSellerBars,
} from "@/features/admin/metrics.format";
import type { AdminOverview } from "@/features/admin/metrics.types";

function overview(overrides: Partial<AdminOverview["stats"]> = {}): AdminOverview {
  return {
    period: {
      month: "2026-08",
      from: "2026-08-01T00:00:00+07:00",
      to: "2026-09-01T00:00:00+07:00",
      previousFrom: "2026-07-01T00:00:00+07:00",
      previousTo: "2026-08-01T00:00:00+07:00",
    },
    stats: {
      gmv: { value: 428500, previous: 362400, sparkline: [0, 0, 0, 0, 0, 0, 0, 0] },
      newSellers: { value: 32, previous: 0, sparkline: [0, 1, 0, 0, 0, 0, 0, 3] },
      activeListings: { value: 6184, sellerCount: 442 },
      commission: {
        value: 12850,
        previous: 12850,
        sparkline: [1, 2, 3, 4, 5, 6, 7, 8],
        averageRatePercent: 3,
      },
      ...overrides,
    },
    monthlySales: [],
    topSellers: [],
    gameShare: [],
  };
}

describe("Thai months", () => {
  it("names months the way the design does, with the Buddhist year", () => {
    expect(thaiMonthShort("2026-05")).toBe("พ.ค.");
    expect(thaiMonthYear("2026-08")).toBe("สิงหาคม 2569");
  });

  it("writes the year once when a range stays within it", () => {
    expect(thaiMonthRange("2026-01", "2026-06")).toBe("ม.ค. – มิ.ย. 2569");
    expect(thaiMonthRange("2025-10", "2026-03")).toBe("ต.ค. 2568 – มี.ค. 2569");
  });

  it("describes the sales trend by its first and last month", () => {
    expect(
      salesTrendDescription([
        { month: "2026-03", singles: 0, sealed: 0 },
        { month: "2026-08", singles: 0, sealed: 0 },
      ]),
    ).toBe("ยอดขายรวม มี.ค. – ส.ค. 2569 (บาท)");
  });
});

describe("formatDelta", () => {
  it("shows growth and decline with one decimal place", () => {
    expect(formatDelta(428500, 362400)).toEqual({ label: "+18.2%", trend: "up" });
    expect(formatDelta(90, 100)).toEqual({ label: "−10.0%", trend: "down" });
  });

  it("says new instead of dividing by a zero previous month", () => {
    expect(formatDelta(5, 0)).toEqual({ label: "ใหม่", trend: "new" });
  });

  it("hides the badge when both months are zero", () => {
    expect(formatDelta(0, 0)).toBeNull();
  });

  it("calls an unchanged month flat", () => {
    expect(formatDelta(100, 100)).toEqual({ label: "0.0%", trend: "flat" });
  });
});

describe("sparkBars", () => {
  it("scales the tallest week to the full height", () => {
    expect(sparkBars([0, 13, 26], 26)).toEqual([2, 13, 26]);
  });

  it("keeps an all-zero series visible as thin bars", () => {
    expect(sparkBars([0, 0, 0])).toEqual([2, 2, 2]);
  });
});

describe("statCards", () => {
  it("builds the four cards in the design's order", () => {
    const cards = statCards(overview());
    expect(cards.map((card) => card.id)).toEqual([
      "gmv",
      "new-sellers",
      "active-listings",
      "commission",
    ]);
    expect(cards[0].value).toBe("฿428,500.00");
    expect(cards[0].footnote).toBe("เทียบกับ ฿362,400.00 เดือนก่อน");
    expect(cards[1].delta?.label).toBe("ใหม่");
    expect(cards[2].footnote).toBe("จาก 442 ร้านค้าทั่วแพลตฟอร์ม");
    expect(cards[3].footnote).toBe("เฉลี่ย 3.0% ของยอดขายที่สำเร็จ");
  });

  it("has no delta or sparkline for live listings, which have no history", () => {
    const listings = statCards(overview())[2];
    expect(listings.delta).toBeNull();
    expect(listings.bars).toBeNull();
  });

  it("says so when nothing completed rather than showing a 0% rate", () => {
    const cards = statCards(
      overview({
        commission: { value: 0, previous: 0, sparkline: [], averageRatePercent: null },
      }),
    );
    expect(cards[3].footnote).toBe("ยังไม่มีคำสั่งซื้อที่สำเร็จในเดือนนี้");
  });
});

describe("top sellers and game share", () => {
  it("draws each seller's bar against the leader", () => {
    const bars = topSellerBars([
      { sellerProfileId: 1, username: "minmin_tcg", displayName: "Min", amount: 86400 },
      { sellerProfileId: 2, username: "kandypop", displayName: "Kandy", amount: 43200 },
    ]);
    expect(bars.map((bar) => bar.percent)).toEqual([100, 50]);
    expect(bars[0].name).toBe("minmin_tcg");
  });

  it("names the folded slice and leads with the biggest real game", () => {
    const shares = [
      { gameId: 1, gameName: "Pokémon", amount: 460, percent: 46, others: false },
      { gameId: null, gameName: null, amount: 70, percent: 7, others: true },
    ];
    expect(gameSlices(shares).map((slice) => slice.name)).toEqual(["Pokémon", "อื่น ๆ"]);
    expect(gameShareHeadline(shares)).toBe("Pokémon ครองส่วนแบ่ง 46%");
    expect(gameShareHeadline([])).toBeNull();
  });
});
