import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { AdminPaymentsPage } from "@/features/admin/pages/AdminPaymentsPage";
import * as financeApi from "@/features/admin/finance.api";
import type { PaymentReview, PaymentSummary, PlatformSetting } from "@/features/admin/finance.types";

vi.mock("@/features/admin/finance.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/admin/finance.api")>();
  return {
    ...actual,
    getPaymentQueue: vi.fn(),
    getPaymentSummary: vi.fn(),
    verifyPayment: vi.fn(),
    getSlipAutoApprove: vi.fn(),
    setSlipAutoApprove: vi.fn(),
    getTransferAccount: vi.fn(),
  };
});

vi.mock("@/features/auth/auth.queries", () => ({
  useAuth: () => ({
    user: { id: 1, role: "ADMIN", username: "admin" },
    isAuthenticated: true,
  }),
}));

const mockSummary: PaymentSummary = {
  awaitingVerification: 2,
  approvedToday: 5,
  rejectedToday: 1,
  awaitingTransfer: 0,
};

const mockPayments: PaymentReview[] = [
  {
    id: 101,
    salesOrderId: 501,
    orderNumber: "ORD-20261015-001",
    buyer: { id: 10, username: "buyer1", displayName: "Buyer One" },
    amount: 1500,
    unpaidTotal: 1500,
    status: "AWAITING_VERIFICATION",
    method: "BANK_TRANSFER",
    referenceCode: "REF-12345",
    slipUrl: "https://example.com/slip1.jpg",
    failureReason: null,
    createdAt: "2026-10-15T10:00:00Z",
    expiresAt: "2026-10-15T12:00:00Z",
    verifiedAt: null,
    splits: [
      {
        sellerOrderId: 701,
        sellerOrderNumber: "S-ORD-001",
        seller: { id: 20, username: "seller1", displayName: "Card Shop" },
        grandTotal: 1500,
      },
    ],
  },
];

const mockSetting: PlatformSetting = {
  key: "payment.slip_auto_approve",
  value: "false",
  description: "Auto approve slips",
  updatedBy: 1,
};

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeApi.getPaymentSummary).mockResolvedValue(mockSummary);
    vi.mocked(financeApi.getPaymentQueue).mockResolvedValue(mockPayments);
    vi.mocked(financeApi.getSlipAutoApprove).mockResolvedValue(mockSetting);
    vi.mocked(financeApi.getTransferAccount).mockResolvedValue({
      key: "payment.transfer_account",
      value: JSON.stringify({ bankName: "กสิกรไทย", accountName: "Pegasus TCG", accountNumber: "1234567890" }),
      description: "Transfer Account",
      updatedBy: 1,
    });
  });

  it("renders page header, payment queue list, and detail panel upon selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPaymentsPage />, { route: "/admin/payments" });

    // Page Header & Stats
    expect(screen.getByText("ตรวจสอบสลิปชำระเงิน")).toBeInTheDocument();
    expect(await screen.findByText("คิวรอตรวจสลิป (1)")).toBeInTheDocument();
    expect(screen.getByText("buyer1")).toBeInTheDocument();

    // Select the payment slip
    await user.click(screen.getByText("buyer1"));

    // Detail Panel assertions
    expect(await screen.findByText("อนุมัติการชำระเงิน")).toBeInTheDocument();
    expect(screen.getByText("ปฏิเสธสลิป")).toBeInTheDocument();

    // Approve action
    vi.mocked(financeApi.verifyPayment).mockResolvedValue({});
    await user.click(screen.getByText("อนุมัติการชำระเงิน"));

    expect(financeApi.verifyPayment).toHaveBeenCalledWith(101, true, undefined);
  });

  it("validates rejection reason and submits rejection", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPaymentsPage />, { route: "/admin/payments" });

    expect(await screen.findByText("buyer1")).toBeInTheDocument();
    await user.click(screen.getByText("buyer1"));

    expect(await screen.findByText("ปฏิเสธสลิป")).toBeInTheDocument();

    // Clicking reject without reason shows error alert
    await user.click(screen.getByText("ปฏิเสธสลิป"));
    expect(await screen.findByText("กรอกเหตุผลก่อนปฏิเสธสลิป")).toBeInTheDocument();

    // Type reason
    const textarea = screen.getByPlaceholderText(/เหตุผลที่ปฏิเสธ/i);
    await user.type(textarea, "ยอดเงินไม่ตรงกับสลิป");

    vi.mocked(financeApi.verifyPayment).mockResolvedValue({});
    await user.click(screen.getByText("ปฏิเสธสลิป"));

    expect(financeApi.verifyPayment).toHaveBeenCalledWith(101, false, "ยอดเงินไม่ตรงกับสลิป");
  });

  it("renders error state when queue fetch fails", async () => {
    vi.mocked(financeApi.getPaymentQueue).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminPaymentsPage />, { route: "/admin/payments" });

    expect(await screen.findByText("โหลดคิวสลิปไม่สำเร็จ")).toBeInTheDocument();
  });
});
