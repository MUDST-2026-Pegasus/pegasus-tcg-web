import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as verificationApi from "@/features/admin/verification.api";
import type { Verification } from "@/features/admin/verification.types";
import { AdminSellerApprovalPage } from "@/features/admin/pages/AdminSellerApprovalPage";
import type { PageResponse } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

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
      username: "admin_user",
      displayName: "Admin User",
      roles: ["ADMIN"],
    },
    isAuthenticated: true,
  }),
}));

const mockVerification: Verification = {
  id: 101,
  sellerProfileId: 10,
  legalFirstName: "สมชาย",
  legalLastName: "ใจดี",
  bankCode: "KBANK",
  bankName: "กสิกรไทย",
  bankAccountNumber: "1234567890",
  bankBookImageKey: "bank-book-1.jpg",
  bankBookImageUrl: null,
  status: "SUBMITTED",
  submittedAt: "2026-10-14T08:00:00Z",
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
};

function mockQueuePage(items: Verification[]): PageResponse<Verification> {
  return {
    items,
    page: 0,
    size: 20,
    totalItems: items.length,
    totalPages: 1,
  };
}

describe("AdminSellerApprovalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title, status metrics, and verification queue list", async () => {
    vi.mocked(verificationApi.getVerificationQueue).mockResolvedValue(mockQueuePage([mockVerification]));
    vi.mocked(verificationApi.startReview).mockResolvedValue({
      ...mockVerification,
      status: "UNDER_REVIEW",
      reviewedBy: 99,
    });

    const user = userEvent.setup();
    renderWithProviders(<AdminSellerApprovalPage />, { route: "/admin/sellers" });

    // Header
    expect(screen.getByText("อนุมัติผู้ขาย")).toBeInTheDocument();

    // Verification in queue
    expect(await screen.findByText("สมชาย ใจดี")).toBeInTheDocument();
    expect(screen.getByText("กสิกรไทย")).toBeInTheDocument();

    // Click item to view detail panel
    await user.click(screen.getByText("สมชาย ใจดี"));

    // Detail Panel
    expect(await screen.findByText("เลขบัญชีธนาคาร")).toBeInTheDocument();
    expect(screen.getByText("123-4-56789-0")).toBeInTheDocument();
    expect(await screen.findByText("ผลการตรวจสอบ")).toBeInTheDocument();
  });

  it("renders error state when verification queue fails", async () => {
    vi.mocked(verificationApi.getVerificationQueue).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminSellerApprovalPage />, { route: "/admin/sellers" });

    expect(await screen.findByText("โหลดคิวคำขอไม่สำเร็จ")).toBeInTheDocument();
  });
});
