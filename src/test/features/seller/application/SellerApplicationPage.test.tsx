import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { SellerApplicationPage } from "@/features/seller/application/SellerApplicationPage";
import * as authQueries from "@/features/auth/auth.queries";
import * as applicationQueries from "@/features/seller/application/application.queries";
import type { Verification } from "@/features/seller/application/application.types";
import { renderWithProviders } from "../../../utils";

vi.mock("@/features/auth/auth.queries", () => ({
  authKeys: { me: () => ["auth", "me"] },
  useAuth: vi.fn(),
}));

vi.mock("@/features/seller/application/application.queries", () => ({
  sellerApplicationKeys: {
    all: ["seller-application"],
    verifications: () => ["seller-application", "verifications"],
  },
  useLatestVerification: vi.fn(),
  useSubmitVerification: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

const mockVerification: Verification = {
  id: 42,
  legalFirstName: "สมชาย",
  legalLastName: "ใจดี",
  bankCode: "KBANK",
  bankName: "กสิกรไทย",
  bankAccountNumber: "1234567890",
  bankBookImageKey: "kyc/book-1.jpg",
  bankBookImageUrl: "https://example.com/book-1.jpg",
  sellerProfileId: 10,
  status: "SUBMITTED",
  submittedAt: "2026-10-01T10:00:00Z",
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
};

describe("SellerApplicationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it("redirects to /seller when the user already has the SELLER role", () => {
    vi.mocked(authQueries.useAuth).mockReturnValue({
      user: { id: 1, email: "seller@test.com", username: "seller" },
      hasRole: (role: string) => role === "SELLER",
    } as unknown as ReturnType<typeof authQueries.useAuth>);

    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: null,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    renderWithProviders(
      <Routes>
        <Route path="/seller/apply" element={<SellerApplicationPage />} />
        <Route path="/seller" element={<div>Seller Dashboard Destination</div>} />
      </Routes>,
      { route: "/seller/apply" },
    );

    expect(screen.getByText("Seller Dashboard Destination")).toBeInTheDocument();
  });

  it("renders loading skeleton while fetching latest verification", () => {
    vi.mocked(authQueries.useAuth).mockReturnValue({
      user: { id: 1, email: "buyer@test.com", username: "buyer" },
      hasRole: () => false,
    } as unknown as ReturnType<typeof authQueries.useAuth>);

    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    renderWithProviders(<SellerApplicationPage />);

    expect(
      screen.getByRole("status", { name: "กำลังโหลดใบสมัคร" }),
    ).toBeInTheDocument();
  });

  it("renders application form when user has no prior verification application", () => {
    vi.mocked(authQueries.useAuth).mockReturnValue({
      user: { id: 1, email: "buyer@test.com", username: "buyer" },
      hasRole: () => false,
    } as unknown as ReturnType<typeof authQueries.useAuth>);

    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: null,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    renderWithProviders(<SellerApplicationPage />);

    expect(screen.getByRole("heading", { name: "สมัครเป็นผู้ขาย" })).toBeInTheDocument();
    expect(screen.getByText("ใช้เวลาไม่ถึง 2 นาที")).toBeInTheDocument();
  });

  it("renders ApplicationStatusView when an application is submitted and pending review", () => {
    vi.mocked(authQueries.useAuth).mockReturnValue({
      user: { id: 1, email: "buyer@test.com", username: "buyer" },
      hasRole: () => false,
    } as unknown as ReturnType<typeof authQueries.useAuth>);

    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: mockVerification,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    renderWithProviders(<SellerApplicationPage />);

    expect(screen.getByText("เลขที่คำขอ")).toBeInTheDocument();
    expect(screen.getByText("ส่งเมื่อ")).toBeInTheDocument();
  });

  it("renders application form with rejection message when previous verification was rejected", () => {
    const rejectedVerification: Verification = {
      ...mockVerification,
      status: "REJECTED",
      rejectionReason: "เอกสารหน้าสมุดบัญชีไม่ชัดเจน กรุณาอัปโหลดใหม่",
      reviewedAt: "2026-10-02T12:00:00Z",
    };

    vi.mocked(authQueries.useAuth).mockReturnValue({
      user: { id: 1, email: "buyer@test.com", username: "buyer" },
      hasRole: () => false,
    } as unknown as ReturnType<typeof authQueries.useAuth>);

    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: rejectedVerification,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    renderWithProviders(<SellerApplicationPage />);

    // Header should be visible so user can reapply
    expect(screen.getByRole("heading", { name: "สมัครเป็นผู้ขาย" })).toBeInTheDocument();
    // Rejection reason is displayed in the form
    expect(
      screen.getByText("เอกสารหน้าสมุดบัญชีไม่ชัดเจน กรุณาอัปโหลดใหม่"),
    ).toBeInTheDocument();
  });
});
