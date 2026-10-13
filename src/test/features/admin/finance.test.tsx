import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import * as financeApi from "@/features/admin/finance.api";
import {
  formatAccountNumber,
  formatBaht,
  initialsOf,
  matchesSearch,
  refundSourceLabel,
} from "@/features/admin/finance.format";
import type { AdminPayout, AdminRefund, PaymentReview } from "@/features/admin/finance.types";
import { AdminPaymentReviewContent } from "@/features/admin/components/AdminPaymentReviewContent";
import { AdminPayoutsContent } from "@/features/admin/components/AdminPayoutsContent";
import { AdminRefundsContent } from "@/features/admin/components/AdminRefundsContent";
import { api } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);

const buyer = { id: 7, username: "somchai.k", displayName: "Somchai" };
const seller = { id: 3, username: "kandypop", displayName: "kandypop Cards" };

const payment: PaymentReview = {
  id: 20481,
  salesOrderId: 99,
  orderNumber: "PGS-20261014-000241",
  buyer,
  amount: 1850,
  unpaidTotal: 1850,
  status: "AWAITING_VERIFICATION",
  method: "BANK_TRANSFER",
  referenceCode: "2026101400051234",
  slipUrl: "https://slips.test/payments/slip.png",
  failureReason: null,
  createdAt: "2026-10-13T16:58:00Z",
  expiresAt: "2026-10-13T17:58:00Z",
  verifiedAt: null,
  splits: [
    { sellerOrderId: 1, sellerOrderNumber: "SO-1", seller, grandTotal: 1240 },
    { sellerOrderId: 2, sellerOrderNumber: "SO-2", seller: { ...seller, id: 4, username: "minmin_tcg" }, grandTotal: 610 },
  ],
};

const refund: AdminRefund = {
  id: 3015,
  salesOrderId: 99,
  orderNumber: "PGS-20261014-000198",
  sellerOrderId: 1,
  sellerOrderNumber: "SO-10198-2",
  returnRequestId: 912,
  resolution: "PARTIAL_REFUND",
  buyer,
  seller,
  amount: 450,
  reason: "damaged",
  status: "APPROVED",
  method: "BANK_TRANSFER",
  bankName: "ธนาคารกรุงเทพ",
  accountName: "สมชาย กิตติวงศ์",
  accountNumber: "1234567890",
  transferReference: null,
  escrowAmount: 1200,
  escrowRefunded: 0,
  failedAttempts: 1,
  lastFailureReason: "บัญชีปิดแล้ว",
  requestedAt: "2026-10-13T14:00:00Z",
  processedAt: null,
};

const payout: AdminPayout = {
  id: 1043,
  sellerProfileId: seller.id,
  seller,
  amount: 12500,
  currency: "THB",
  status: "PROCESSING",
  account: { bankName: "กสิกรไทย", accountName: "กานดา พรหมมา", accountNumber: "2345678901", verifiedAt: "2026-10-01T00:00:00Z" },
  wallet: { available: 18940, pending: 0, reserved: 12500 },
  requestedAt: "2026-10-13T02:12:00Z",
  approvedAt: "2026-10-13T07:30:00Z",
  approvedBy: "Kant S.",
  paidAt: null,
  transferReference: null,
  rejectionReason: null,
  orders: [{ sellerOrderId: 5, sellerOrderNumber: "SO-10188-1", sellerNetAmount: 4200, completedAt: "2026-10-02T00:00:00Z" }],
  ordersLinked: false,
};

function renderWithClient(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());

describe("admin finance API contracts", () => {
  it("reads the enriched queues and their summaries", async () => {
    get.mockResolvedValue([] as never);
    await financeApi.getPaymentQueue();
    await financeApi.getRefundQueue("ALL");
    await financeApi.getPayoutQueue();
    await financeApi.getPayoutSummary();
    expect(get).toHaveBeenNthCalledWith(1, "/admin/payments", { query: { status: "AWAITING_VERIFICATION" } });
    expect(get).toHaveBeenNthCalledWith(2, "/admin/refunds", { query: { status: "ALL" } });
    expect(get).toHaveBeenNthCalledWith(3, "/admin/payouts", { query: undefined });
    expect(get).toHaveBeenNthCalledWith(4, "/admin/payouts/summary");
  });

  it("writes the slip auto-approve setting as a JSON boolean", async () => {
    put.mockResolvedValue({} as never);
    await financeApi.setSlipAutoApprove(true);
    expect(put).toHaveBeenCalledWith("/admin/settings/payment.slip_auto_approve", { value: "true" });
  });

  it("sends payout and refund transitions with backend payloads", async () => {
    post.mockResolvedValue({} as never);
    await financeApi.completePayout(5, "REF-1", "payouts/slip.png");
    await financeApi.startRefundTransfer(7, "1234567890");
    expect(post).toHaveBeenNthCalledWith(1, "/admin/payouts/5/paid", {
      transferReference: "REF-1", slipImageKey: "payouts/slip.png",
    });
    expect(post).toHaveBeenNthCalledWith(2, "/admin/refunds/7/processing", { accountNumber: "1234567890" });
  });
});

describe("admin finance format", () => {
  it("formats money, accounts and initials", () => {
    expect(formatBaht(1850)).toBe("฿1,850.00");
    expect(formatAccountNumber("1234567890")).toBe("123-4-56789-0");
    expect(formatAccountNumber("12345")).toBe("12345");
    expect(initialsOf("somchai.k")).toBe("SK");
    expect(initialsOf("kandypop")).toBe("KA");
  });

  it("labels where a refund came from and searches case-insensitively", () => {
    expect(refundSourceLabel(null, null).label).toBe("ยกเลิก");
    expect(refundSourceLabel("PARTIAL_REFUND", 3).label).toBe("คืนบางส่วน");
    expect(matchesSearch("rf-30", "RF-3015", "ORD")).toBe(true);
    expect(matchesSearch("nope", "RF-3015")).toBe(false);
  });
});

describe("admin finance pages", () => {
  it("approves a slip from the review queue", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/admin/payments") return [payment] as never;
      if (path === "/admin/payments/summary")
        return { awaitingVerification: 1, approvedToday: 4, rejectedToday: 0, awaitingTransfer: 2 } as never;
      if (path.startsWith("/admin/settings/payment.slip_auto_approve"))
        return { key: "payment.slip_auto_approve", value: "false", description: "", updatedBy: null } as never;
      return { key: "payment.transfer_account", value: '{"bankName":"กสิกรไทย","accountName":"บจก. เพกาซัส","accountNumber":"1112223334"}', description: "", updatedBy: null } as never;
    });
    post.mockResolvedValue({} as never);
    renderWithClient(<AdminPaymentReviewContent />);

    fireEvent.click(await screen.findByRole("button", { name: /somchai\.k/ }));
    expect(await screen.findByText("ยอดตรงกับยอดค้างชำระ ฿1,850.00")).toBeTruthy();
    expect(screen.getByText("minmin_tcg")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ปฏิเสธสลิป" }));
    expect(screen.getByRole("alert").textContent).toContain("กรอกเหตุผล");
    fireEvent.click(screen.getByRole("button", { name: "อนุมัติการชำระเงิน" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/admin/payments/20481/verify", { approved: true, reason: undefined }),
    );
  });

  it("starts a refund transfer with the retyped account number", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/admin/refunds") return [refund] as never;
      if (path === "/admin/refunds/summary")
        return { ready: 1, processing: 0, failedAwaitingBuyer: 1, processedThisMonth: 2, processedAmountThisMonth: 900 } as never;
      return [] as never;
    });
    post.mockResolvedValue({} as never);
    renderWithClient(<AdminRefundsContent />);

    fireEvent.click(await screen.findByRole("button", { name: /RF-3015/ }));
    expect(screen.getByText("โอนพลาด 1 ครั้ง")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "เลขบัญชีปลายทาง" }), {
      target: { value: "123-4-56789-0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "เริ่มโอน" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/admin/refunds/3015/processing", { accountNumber: "1234567890" }),
    );
  });

  it("requires a reason before marking a payout transfer as failed", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/admin/payouts") return [payout] as never;
      return { requested: 0, inProgress: 1, paidAmountThisMonth: 0, closedThisMonth: 0 } as never;
    });
    post.mockResolvedValue({} as never);
    renderWithClient(<AdminPayoutsContent />);

    fireEvent.click(await screen.findByRole("button", { name: /PO-1043/ }));
    expect(screen.getByText("คำสั่งซื้อที่จะผูกกับการถอนนี้")).toBeTruthy();
    expect(screen.getByRole("button", { name: "ยืนยันว่าจ่ายแล้ว" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "โอนไม่สำเร็จ" }));
    fireEvent.click(await screen.findByRole("button", { name: "บันทึกว่าโอนไม่สำเร็จ" }));
    expect(await screen.findByText("กรุณากรอกเหตุผล")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("เหตุผล"), { target: { value: "ธนาคารตีกลับ" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึกว่าโอนไม่สำเร็จ" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/admin/payouts/1043/fail", { reason: "ธนาคารตีกลับ" }),
    );
  });
});
