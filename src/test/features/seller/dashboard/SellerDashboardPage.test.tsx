import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { SellerDashboardPage } from "@/features/seller/dashboard/SellerDashboardPage";
import * as dashboardApi from "@/features/seller/dashboard/dashboard.api";
import type { SellerDashboard } from "@/features/seller/dashboard/dashboard.types";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/seller/dashboard/dashboard.api", () => ({
  getSellerDashboard: vi.fn(),
}));

vi.mock("@/features/auth/auth.queries", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: "seller@pegasus.com",
      displayName: "Seller Somchai",
      username: "somchai_shop",
      role: "SELLER",
      avatarUrl: null,
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

function mockDashboardData(overrides: Partial<SellerDashboard> = {}): SellerDashboard {
  return {
    period: {
      month: "2026-10",
      from: "2026-10-01T00:00:00+07:00",
      to: "2026-11-01T00:00:00+07:00",
    },
    sales: {
      value: 24850,
      previous: 22187.5,
      orderCount: 56,
      previousOrderCount: 50,
      monthly: [
        { month: "2026-09", amount: 22187.5 },
        { month: "2026-10", amount: 24850 },
      ],
    },
    month: { revenue: 26000, cost: 16420, commission: 1242.5, net: 8337.5 },
    orders: { PAID: 5, PREPARING: 3, PENDING_PAYMENT: 2, COMPLETED: 40 },
    listings: {
      active: 142,
      publishedThisMonth: 5,
      lowStockThreshold: 2,
      lowStockCount: 2,
      lowStock: [
        {
          listingId: 7,
          productName: "Charizard ex",
          lotLabel: "Box A",
          conditionCode: "NM",
          quantityAvailable: 1,
          quantityTotal: 10,
        },
        {
          listingId: 8,
          productName: "Pikachu VMAX",
          lotLabel: null,
          conditionCode: "LP",
          quantityAvailable: 2,
          quantityTotal: 4,
        },
      ],
    },
    reviews: { average: 4.75, count: 312, thisMonth: 2, unreplied: 0 },
    wallet: { withdrawable: 3420, pending: 1850.5 },
    recentOrders: [
      {
        sellerOrderId: 41,
        sellerOrderNumber: "PGS-20261013-000041-S1",
        buyerUsername: "nattapong_p",
        buyerDisplayName: "Nattapong",
        firstItemName: "Charizard ex",
        itemCount: 2,
        grandTotal: 1850,
        status: "PAID",
        createdAt: "2026-10-13T09:00:00+07:00",
      },
    ],
    ...overrides,
  };
}

describe("SellerDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders seller greeting, sales summary, todo items, recent orders and low stock items", async () => {
    vi.mocked(dashboardApi.getSellerDashboard).mockResolvedValue(mockDashboardData());

    renderWithProviders(<SellerDashboardPage />, { route: "/seller" });

    // Greeting
    expect(await screen.findByText(/สวัสดี, Seller Somchai 👋/i)).toBeInTheDocument();

    // Actions
    expect(screen.getByText("ดูหน้าร้าน").closest("a")).toHaveAttribute("href", "/u/somchai_shop");

    // Recent orders
    expect(screen.getByText("PGS-20261013-000041-S1")).toBeInTheDocument();
    expect(screen.getByText(/Nattapong/i)).toBeInTheDocument();

    // Low stock
    expect(screen.getByText("Charizard ex — Box A")).toBeInTheDocument();
    expect(screen.getByText("Pikachu VMAX")).toBeInTheDocument();
  });

  it("renders error boundary state when dashboard query fails", async () => {
    vi.mocked(dashboardApi.getSellerDashboard).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<SellerDashboardPage />, { route: "/seller" });

    expect(await screen.findByText("โหลดแดชบอร์ดไม่สำเร็จ")).toBeInTheDocument();
  });
});
