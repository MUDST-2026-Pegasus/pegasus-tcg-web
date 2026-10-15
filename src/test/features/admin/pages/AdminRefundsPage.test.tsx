import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { AdminRefundsPage } from "@/features/admin/pages/AdminRefundsPage";
import * as financeApi from "@/features/admin/finance.api";
import type { AdminRefund, RefundSummary } from "@/features/admin/finance.types";

vi.mock("@/features/admin/finance.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/admin/finance.api")>();
  return {
    ...actual,
    getRefundQueue: vi.fn(),
    getRefundSummary: vi.fn(),
    getRefundTransfers: vi.fn(),
    startRefundTransfer: vi.fn(),
    completeRefundTransfer: vi.fn(),
    failRefundTransfer: vi.fn(),
  };
});

vi.mock("@/features/auth/auth.queries", () => ({
  useAuth: () => ({
    user: { id: 1, role: "ADMIN", username: "admin" },
    isAuthenticated: true,
  }),
}));

const mockSummary: RefundSummary = {
  ready: 1,
  processing: 0,
  failedAwaitingBuyer: 0,
  processedThisMonth: 3,
  processedAmountThisMonth: 4500,
};

const mockRefunds: AdminRefund[] = [
  {
    id: 301,
    orderNumber: "ORD-20261015-301",
    sellerOrderNumber: "S-ORD-301",
    seller: { id: 5, username: "cardseller", displayName: "Card Kingdom" },
    buyer: { id: 25, username: "buyer301", displayName: "Buyer 301" },
    returnRequestId: null,
    resolution: null,
    amount: 1200,
    currency: "THB",
    status: "APPROVED",
    method: "BANK_TRANSFER",
    bankName: "กสิกรไทย",
    accountName: "นาย สมชาย มีสุข",
    accountNumber: "1234567890",
    transferReference: null,
    escrowAmount: 1200,
    escrowRefunded: 0,
    failedAttempts: 0,
    lastFailureReason: null,
    requestedAt: "2026-10-15T08:00:00Z",
    processedAt: null,
  },
];

describe("AdminRefundsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeApi.getRefundSummary).mockResolvedValue(mockSummary);
    vi.mocked(financeApi.getRefundQueue).mockResolvedValue(mockRefunds);
    vi.mocked(financeApi.getRefundTransfers).mockResolvedValue([]);
  });

  it("renders page header, queue list, and detail panel upon selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminRefundsPage />, { route: "/admin/refunds" });

    // Page Header & Queue
    expect(screen.getByText("คืนเงินผู้ซื้อ")).toBeInTheDocument();
    expect(await screen.findByText("buyer301")).toBeInTheDocument();

    // Select the refund item
    await user.click(screen.getByText("buyer301"));

    // Detail Panel assertions
    expect(await screen.findByText("ขั้นตอนการโอนคืน")).toBeInTheDocument();
    expect(screen.getByText("ยืนยันเลขบัญชี แล้วเริ่มโอน")).toBeInTheDocument();

    // Type account number to confirm destination
    const input = screen.getByLabelText("เลขบัญชีปลายทาง");
    await user.type(input, "1234567890");

    vi.mocked(financeApi.startRefundTransfer).mockResolvedValue({});
    const startBtn = screen.getByRole("button", { name: "เริ่มโอน" });
    await user.click(startBtn);

    expect(financeApi.startRefundTransfer).toHaveBeenCalledWith(301, "1234567890");
  });

  it("completes refund transfer when in PROCESSING status", async () => {
    const processingRefund: AdminRefund = {
      ...mockRefunds[0],
      status: "PROCESSING",
    };
    vi.mocked(financeApi.getRefundQueue).mockResolvedValue([processingRefund]);

    const user = userEvent.setup();
    renderWithProviders(<AdminRefundsPage />, { route: "/admin/refunds" });

    expect(await screen.findByText("buyer301")).toBeInTheDocument();
    await user.click(screen.getByText("buyer301"));

    expect(await screen.findByText("ยืนยันผลการโอน")).toBeInTheDocument();

    const refInput = screen.getByLabelText("เลขอ้างอิงการโอน");
    await user.type(refInput, "TXN-999888");

    vi.mocked(financeApi.completeRefundTransfer).mockResolvedValue({});
    const confirmBtn = screen.getByRole("button", { name: "ยืนยันว่าโอนแล้ว" });
    await user.click(confirmBtn);

    expect(financeApi.completeRefundTransfer).toHaveBeenCalledWith(301, "TXN-999888");
  });

  it("renders error state when queue fetch fails", async () => {
    vi.mocked(financeApi.getRefundQueue).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminRefundsPage />, { route: "/admin/refunds" });

    expect(await screen.findByText("โหลดรายการคืนเงินไม่สำเร็จ")).toBeInTheDocument();
  });
});
