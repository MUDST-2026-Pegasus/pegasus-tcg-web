import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { SellerLayout } from "@/features/seller/shared/SellerLayout";
import * as sellerApi from "@/features/seller/shared/seller.api";
import type { SellerProfile } from "@/features/seller/shared/seller.types";

vi.mock("@/features/seller/shared/seller.api", () => ({
  getSellerProfile: vi.fn(),
}));

vi.mock("@/features/auth/auth.queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/auth.queries")>();
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 10, role: "SELLER", username: "cardseller" },
      isAuthenticated: true,
      hasRole: (role: string) => role === "SELLER",
    }),
    useLogout: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const mockProfile: SellerProfile = {
  id: 10,
  userId: 10,
  status: "VERIFIED",
  canPublish: true,
  vacationMode: false,
  handlingDays: 2,
  autoAcceptOrders: true,
  verifiedAt: "2026-01-01T00:00:00Z",
  suspendedReason: null,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("SellerLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    vi.mocked(sellerApi.getSellerProfile).mockResolvedValue(mockProfile);
  });

  it("renders seller layout with sidebar navigation, header, and content area", async () => {
    renderWithProviders(<SellerLayout />, { route: "/seller" });

    // Sidebar items
    expect(screen.getByText("DASHBOARD")).toBeInTheDocument();
    expect(screen.getByText("SELLER")).toBeInTheDocument();

    // Verify navigation links exist
    expect(screen.getByText("แดชบอร์ด")).toBeInTheDocument();
    expect(screen.getByText("จัดการคำสั่งซื้อ")).toBeInTheDocument();
  });
});
