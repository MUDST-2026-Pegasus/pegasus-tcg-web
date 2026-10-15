import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import * as metricsApi from "@/features/admin/metrics.api";
import type { AdminOverview } from "@/features/admin/metrics.types";
import { AdminOverviewPage } from "@/features/admin/pages/AdminOverviewPage";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/metrics.api", () => ({
  getOverview: vi.fn(),
}));

function mockOverviewData(overrides: Partial<AdminOverview["stats"]> = {}): AdminOverview {
  return {
    period: {
      month: "2026-10",
      from: "2026-10-01T00:00:00+07:00",
      to: "2026-11-01T00:00:00+07:00",
      previousFrom: "2026-09-01T00:00:00+07:00",
      previousTo: "2026-10-01T00:00:00+07:00",
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
    monthlySales: [
      { month: "2026-08", singles: 200000, sealed: 50000 },
      { month: "2026-09", singles: 250000, sealed: 60000 },
      { month: "2026-10", singles: 350000, sealed: 78500 },
    ],
    topSellers: [
      { sellerProfileId: 1, username: "cardmaster", displayName: "Card Master Shop", amount: 85000 },
      { sellerProfileId: 2, username: "dragontcg", displayName: "Dragon TCG", amount: 62000 },
    ],
    gameShare: [
      { gameId: 1, gameName: "Pokémon", amount: 250000, percent: 60, others: false },
      { gameId: 2, gameName: "Magic: The Gathering", amount: 100000, percent: 25, others: false },
      { gameId: 3, gameName: "Yu-Gi-Oh!", amount: 60000, percent: 15, others: false },
    ],
  };
}

describe("AdminOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page header and stat cards with formatted values", async () => {
    vi.mocked(metricsApi.getOverview).mockResolvedValue(mockOverviewData());

    renderWithProviders(<AdminOverviewPage />, { route: "/admin" });

    // Page Header
    expect(screen.getByText("ภาพรวมแพลตฟอร์ม")).toBeInTheDocument();
    expect(screen.getByText(/สรุปผลประกอบการและกิจกรรมทั้งหมดบน Pegasus TCG/i)).toBeInTheDocument();

    // Stat Cards
    expect(await screen.findByText(/฿428,500/i)).toBeInTheDocument();
    expect(screen.getByText("6,184")).toBeInTheDocument();
    expect(screen.getByText(/฿12,850/i)).toBeInTheDocument();

    // Top sellers
    expect(screen.getByText("cardmaster")).toBeInTheDocument();
    expect(screen.getByText("dragontcg")).toBeInTheDocument();
  });

  it("renders error boundary state when metrics query fails", async () => {
    vi.mocked(metricsApi.getOverview).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminOverviewPage />, { route: "/admin" });

    expect(await screen.findByText("โหลดภาพรวมแพลตฟอร์มไม่สำเร็จ")).toBeInTheDocument();
  });
});
