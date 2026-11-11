import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import * as auditApi from "@/features/admin/audit.api";
import * as catalogApi from "@/features/admin/catalog.api";
import * as metricsApi from "@/features/admin/metrics.api";
import * as reviewsApi from "@/features/admin/reviews.api";
import * as usersApi from "@/features/admin/users.api";
import * as verificationApi from "@/features/admin/verification.api";
import * as reportApi from "@/features/admin/weekly-report.api";
import { AdminOverviewPage } from "@/features/admin/pages/AdminOverviewPage";
import { AdminReviewsPage } from "@/features/admin/pages/AdminReviewsPage";
import { AdminSellerApprovalPage } from "@/features/admin/pages/AdminSellerApprovalPage";
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import { AdminWeeklyReportPage } from "@/features/admin/pages/AdminWeeklyReportPage";
import { ROLE_LABEL, USER_STATUS_LABEL, pageSummary } from "@/features/admin/users.format";
import { PRODUCT_TYPE_LABEL, STOCK_STATUS_LABEL } from "@/features/admin/weekly-report.format";
import { registerErrorTranslator } from "@/lib/i18n/errors";
import { testTolgee } from "@/test/i18n";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/metrics.api", () => ({
  getOverview: vi.fn(),
}));

vi.mock("@/features/admin/audit.api", () => ({
  getAuditLogs: vi.fn(),
  getAuditSummary: vi.fn(),
}));

vi.mock("@/features/admin/weekly-report.api", () => ({
  getWeeklyReport: vi.fn(),
  exportWeeklyReport: vi.fn(),
  getWeeklyThresholds: vi.fn(),
  updateWeeklyThresholds: vi.fn(),
}));

vi.mock("@/features/admin/catalog.api", () => ({
  getGames: vi.fn(),
}));

vi.mock("@/features/admin/users.api", () => ({
  getAdminUsers: vi.fn(),
  getAdminUser: vi.fn(),
  updateUserStatus: vi.fn(),
  grantRole: vi.fn(),
  revokeRole: vi.fn(),
  downloadAdminUsersCsv: vi.fn(),
}));

vi.mock("@/features/admin/reviews.api", () => ({
  getSellerReviews: vi.fn(),
  getSellerProfile: vi.fn(),
  setReviewVisibility: vi.fn(),
}));

vi.mock("@/features/admin/verification.api", () => ({
  getVerificationQueue: vi.fn(),
  startReview: vi.fn(),
  approveVerification: vi.fn(),
  rejectVerification: vi.fn(),
  getVerification: vi.fn(),
}));

vi.mock("@/features/auth/auth.queries", () => ({
  useAuth: () => ({
    user: {
      id: 99,
      email: "admin@pegasus.com",
      username: "superadmin",
      displayName: "Super Admin",
      roles: ["ADMIN"],
    },
    isAuthenticated: true,
  }),
}));

const THAI_CHAR_REGEX = /[\u0E00-\u0E7F]/;

describe("Admin i18n English Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("users.format English plural & labels", () => {
    it("renders pageSummary with ICU plural: 1 account vs 2 accounts", () => {
      document.documentElement.lang = "en";
      registerErrorTranslator(testTolgee("en"));
      try {
        expect(pageSummary(0, 20, 1)).toBe("Showing 1–1 of 1 account");
        expect(pageSummary(0, 20, 2)).toBe("Showing 1–2 of 2 accounts");
        expect(pageSummary(0, 20, 4982)).toBe("Showing 1–20 of 4,982 accounts");
        expect(pageSummary(0, 20, 0)).toBe("No accounts found");
      } finally {
        document.documentElement.lang = "th";
        registerErrorTranslator(testTolgee("th"));
      }
    });

    it("renders role and status labels in English without Thai characters", () => {
      document.documentElement.lang = "en";
      registerErrorTranslator(testTolgee("en"));
      try {
        expect(ROLE_LABEL.BUYER).toBe("Buyer");
        expect(ROLE_LABEL.SELLER).toBe("Seller");
        expect(ROLE_LABEL.ADMIN).toBe("Admin");
        expect(ROLE_LABEL.SUPPORT).toBe("Support Team");

        expect(USER_STATUS_LABEL.ACTIVE).toBe("Active");
        expect(USER_STATUS_LABEL.SUSPENDED).toBe("Suspended");
        expect(USER_STATUS_LABEL.DEACTIVATED).toBe("Deactivated");

        Object.values(ROLE_LABEL).forEach((label) => {
          expect(label).not.toMatch(THAI_CHAR_REGEX);
        });
        Object.values(USER_STATUS_LABEL).forEach((label) => {
          expect(label).not.toMatch(THAI_CHAR_REGEX);
        });
      } finally {
        document.documentElement.lang = "th";
        registerErrorTranslator(testTolgee("th"));
      }
    });
  });

  describe("weekly-report.format English labels", () => {
    it("renders stock status and product type labels in English without Thai characters", () => {
      document.documentElement.lang = "en";
      registerErrorTranslator(testTolgee("en"));
      try {
        expect(PRODUCT_TYPE_LABEL.SINGLE_CARD).toBe("Single Card");
        expect(PRODUCT_TYPE_LABEL.SEALED).toBe("Sealed Product");
        expect(PRODUCT_TYPE_LABEL.OTHER).toBe("Other");

        expect(STOCK_STATUS_LABEL.NORMAL).toBe("Normal");
        expect(STOCK_STATUS_LABEL.FAST_MOVING).toBe("Fast-Moving Stock");
        expect(STOCK_STATUS_LABEL.LOW_STOCK).toBe("Low Stock");

        Object.values(PRODUCT_TYPE_LABEL).forEach((label) => {
          expect(label).not.toMatch(THAI_CHAR_REGEX);
        });
        Object.values(STOCK_STATUS_LABEL).forEach((label) => {
          expect(label).not.toMatch(THAI_CHAR_REGEX);
        });
      } finally {
        document.documentElement.lang = "th";
        registerErrorTranslator(testTolgee("th"));
      }
    });
  });

  describe("Admin Views with language: 'en'", () => {
    it("leaves zero Thai characters across AdminOverviewPage", async () => {
      vi.mocked(metricsApi.getOverview).mockResolvedValue({
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
          promotionCost: { value: 0, previous: 0, sparkline: [0, 0, 0, 0, 0, 0, 0, 0] },
          saleSubsidy: { value: 0, previous: 0, sparkline: [0, 0, 0, 0, 0, 0, 0, 0] },
          liveAuctions: 0,
          auctionSalesLast30Days: 0,
        },
        monthlySales: [
          { month: "2026-08", singles: 200000, sealed: 50000 },
          { month: "2026-09", singles: 250000, sealed: 60000 },
          { month: "2026-10", singles: 350000, sealed: 78500 },
        ],
        topSellers: [
          { sellerProfileId: 1, username: "cardmaster", displayName: "Card Master Shop", amount: 85000 },
        ],
        gameShare: [
          { gameId: 1, gameName: "Pokemon", amount: 250000, percent: 100, others: false },
        ],
      });

      vi.mocked(auditApi.getAuditLogs).mockResolvedValue({
        items: [
          {
            id: 1,
            occurredAt: new Date().toISOString(),
            actor: { userId: 7, username: "admin_kant", displayName: "Kant" },
            action: "SELLER_VERIFICATION_APPROVED",
            targetType: "SELLER_VERIFICATION",
            targetId: "12",
            summary: "Approved seller verification #12",
            metadata: {},
            ipAddress: null,
          },
        ],
        page: 0,
        size: 5,
        totalItems: 1,
        totalPages: 1,
      });

      const { container } = renderWithProviders(<AdminOverviewPage />, {
        route: "/admin",
        language: "en",
      });

      expect(await screen.findByText("Platform Overview")).toBeInTheDocument();
      expect(await screen.findByText("Total Sales This Month")).toBeInTheDocument();
      expect(screen.getByText("Monthly Sales")).toBeInTheDocument();
      expect(screen.getByText("Active Listings")).toBeInTheDocument();
      expect(screen.getByText("Commission Collected")).toBeInTheDocument();

      const text = container.textContent ?? "";
      expect(text).not.toMatch(THAI_CHAR_REGEX);
    });

    it("leaves zero Thai characters across AdminWeeklyReportPage", async () => {
      vi.mocked(catalogApi.getGames).mockResolvedValue([
        {
          id: 1,
          code: "pokemon",
          name: "Pokemon",
          nameLocal: "โปเกมอน",
          slug: "pokemon",
          logoUrl: null,
          logoImageUrl: null,
          displayOrder: 1,
          active: true,
          createdBy: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ]);

      vi.mocked(reportApi.getWeeklyReport).mockResolvedValue({
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
          commission: 12000,
          commissionCollected: 12000,
          netProfit: 12855,
          initialStock: 7654,
          soldCount: 1470,
          remainingStock: 6184,
          stockDepleted: 1470,
          wowChangePercent: 18.2,
        },
        totals: {
          initialStock: 7654,
          soldCount: 1470,
          remainingStock: 6184,
          singleCards: 2350,
          sealedBoxes: 1000,
          otherItems: 0,
          gmv: 428500,
          weeklyGmv: 428500,
          commission: 12000,
          commissionCollected: 12000,
          netProfit: 12855,
        },
        chartData: [{ date: "2026-08-03", singles: 100, sealed: 50, other: 0 }],
        kpiHistory: [{ date: "2026-08-03", gmv: 150, netProfit: 20, commission: 5, remainingStock: 6184 }],
        gameDistribution: [
          { game: "Pokemon", gameSlug: "pokemon", gmv: 240000, netProfit: 7200, remainingStock: 2469, percentage: 100 },
        ],
        breakdownByGameAndType: [
          {
            game: "Pokemon",
            gameSlug: "pokemon",
            productType: "SINGLE_CARD",
            productTypeLabel: "Single Card",
            initialStock: 2350,
            soldCount: 610,
            remainingStock: 1740,
            gmv: 146800,
            commission: 4404,
            netProfit: 4404,
            status: "FAST_MOVING",
            statusLabel: "Fast-Moving Stock",
          },
        ],
      });

      const { container } = renderWithProviders(<AdminWeeklyReportPage />, {
        route: "/admin/reports/weekly-stock-profit?week=2026-08-03",
        language: "en",
      });

      expect(await screen.findByText("Weekly Stock & Profit Report")).toBeInTheDocument();
      expect(screen.getByText("Export Report")).toBeInTheDocument();
      expect(screen.getByText("System Settings")).toBeInTheDocument();
      expect(await screen.findByText("Fast-Moving Stock")).toBeInTheDocument();

      const text = container.textContent ?? "";
      expect(text).not.toMatch(THAI_CHAR_REGEX);
    });

    it("leaves zero Thai characters across AdminUsersPage", async () => {
      vi.mocked(usersApi.getAdminUsers).mockResolvedValue({
        items: [
          {
            id: 1,
            email: "john@example.com",
            username: "john_doe",
            displayName: "John Doe",
            bio: "Card collector",
            phone: "0812345678",
            phonePublic: true,
            avatarUrl: null,
            status: "ACTIVE",
            roles: ["BUYER", "SELLER"],
            createdAt: "2026-01-10T10:00:00Z",
            lastLoginAt: "2026-10-15T08:00:00Z",
          },
        ],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      });

      const { container } = renderWithProviders(<AdminUsersPage />, {
        route: "/admin/users",
        language: "en",
      });

      expect(await screen.findByText("User Management")).toBeInTheDocument();
      expect(await screen.findByText("Showing 1–1 of 1 account")).toBeInTheDocument();
      expect(screen.getByText("Add Admin")).toBeInTheDocument();
      expect(screen.getByText("Export CSV")).toBeInTheDocument();

      const text = container.textContent ?? "";
      expect(text).not.toMatch(THAI_CHAR_REGEX);
    });

    it("leaves zero Thai characters across AdminReviewsPage", async () => {
      vi.mocked(reviewsApi.getSellerReviews).mockResolvedValue([
        {
          id: 11,
          sellerOrderId: 55,
          rating: 5,
          title: "Great card",
          comment: "Fast shipping and perfect condition",
          replyComment: "Thank you for shopping with us",
          visible: true,
          createdAt: "2026-10-15T10:00:00Z",
          reviewerUsername: "buyer01",
          reviewerAvatarUrl: null,
        },
      ]);

      vi.mocked(reviewsApi.getSellerProfile).mockResolvedValue({
        username: "cardseller",
        displayName: "Card Kingdom",
        avatarUrl: null,
      });

      const { container } = renderWithProviders(<AdminReviewsPage />, {
        route: "/admin/reviews?seller=cardseller",
        language: "en",
      });

      expect(await screen.findByText("Review Moderation")).toBeInTheDocument();
      expect(await screen.findByText("Great card")).toBeInTheDocument();
      expect(await screen.findByText("Show on Profile")).toBeInTheDocument();

      const text = container.textContent ?? "";
      expect(text).not.toMatch(THAI_CHAR_REGEX);
    });

    it("leaves zero Thai characters across AdminSellerApprovalPage", async () => {
      vi.mocked(verificationApi.getVerificationQueue).mockResolvedValue({
        items: [
          {
            id: 101,
            sellerProfileId: 10,
            legalFirstName: "John",
            legalLastName: "Doe",
            bankCode: "KBANK",
            bankName: "Kasikorn Bank",
            bankAccountNumber: "1234567890",
            bankBookImageKey: "bank-book-1.jpg",
            bankBookImageUrl: null,
            status: "SUBMITTED",
            submittedAt: "2026-10-14T08:00:00Z",
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null,
            sellerAvatarUrl: null,
          },
        ],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      });

      const { container } = renderWithProviders(<AdminSellerApprovalPage />, {
        route: "/admin/sellers",
        language: "en",
      });

      expect(await screen.findByText("Seller Approvals")).toBeInTheDocument();
      expect(await screen.findByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Select an application from the queue on the left to view details and decide.")).toBeInTheDocument();

      const text = container.textContent ?? "";
      expect(text).not.toMatch(THAI_CHAR_REGEX);
    });
  });
});
