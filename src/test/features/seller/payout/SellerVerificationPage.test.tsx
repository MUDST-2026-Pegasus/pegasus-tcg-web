import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as authQueries from "@/features/auth/auth.queries";
import * as applicationQueries from "@/features/seller/application/application.queries";
import type { Verification } from "@/features/seller/application/application.types";
import { SellerVerificationPage } from "@/features/seller/payout/SellerVerificationPage";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/auth/auth.queries", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/seller/application/application.queries", () => ({
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

describe("SellerVerificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authQueries.useAuth).mockReturnValue({
      user: {
        id: 1,
        email: "seller@test.com",
        username: "seller",
        displayName: "Seller Somchai",
        role: "SELLER",
        avatarUrl: null,
      },
      isAuthenticated: true,
      isLoading: false,
    } as unknown as ReturnType<typeof authQueries.useAuth>);
  });

  it("shows loading skeleton when query is pending", () => {
    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    const { container } = renderWithProviders(<SellerVerificationPage />, { route: "/seller/payout/verify" });

    expect(screen.getByText("ยืนยันบัญชีรับเงิน")).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows error alert and retries when verification query fails", async () => {
    const refetch = vi.fn();
    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("Network error"),
      refetch,
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    const user = userEvent.setup();
    renderWithProviders(<SellerVerificationPage />, { route: "/seller/payout/verify" });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows in-review message when verification status is SUBMITTED or UNDER_REVIEW", () => {
    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: mockVerification,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    renderWithProviders(<SellerVerificationPage />, { route: "/seller/payout/verify" });

    expect(screen.getByText("ส่งคำขอแล้ว · รอแอดมินตรวจสอบ")).toBeInTheDocument();
    expect(screen.getByText("บัญชีที่ใช้อยู่ยังไม่เปลี่ยนจนกว่าคำขอใหม่จะได้รับการอนุมัติ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "กลับหน้าถอนเงิน" })).toHaveAttribute("href", "/seller/payout");
  });

  it("shows the application form when there is no pending verification", () => {
    vi.mocked(applicationQueries.useLatestVerification).mockReturnValue({
      data: null,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof applicationQueries.useLatestVerification>);

    renderWithProviders(<SellerVerificationPage />, { route: "/seller/payout/verify" });

    expect(screen.getByText("ยืนยันบัญชีรับเงิน")).toBeInTheDocument();
    expect(screen.getByLabelText(/ชื่อจริง \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/นามสกุลจริง \*/i)).toBeInTheDocument();
  });
});
