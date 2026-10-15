import { beforeEach, describe, expect, it, vi } from "vitest";
import { financeApi } from "@/features/finance/finance.api";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);

beforeEach(() => vi.clearAllMocks());

describe("TCG-394 finance API contracts", () => {
  it("starts a bank transfer with the order and idempotency key", async () => {
    post.mockResolvedValueOnce({ id: 10 } as never);
    await financeApi.createPayment(42, "payment-once");
    expect(post).toHaveBeenCalledWith("/payments", { salesOrderId: 42, method: "BANK_TRANSFER" }, {
      headers: { "Idempotency-Key": "payment-once" },
    });
  });

  it("sends uploaded slip object key to payment API", async () => {
    post.mockResolvedValueOnce({ id: 10 } as never);
    await financeApi.attachPaymentSlip(10, "payments/receipt.png", "BANK-123");
    expect(post).toHaveBeenCalledWith("/payments/10/slip", {
      slipImageKey: "payments/receipt.png", referenceCode: "BANK-123",
    });
  });

  it("loads refund detail for status tracking", async () => {
    get.mockResolvedValue({} as never);
    await financeApi.getRefund(7);
    expect(get).toHaveBeenCalledWith("/refunds/7");
  });

  it("uses the payout and refund endpoints with backend payloads", async () => {
    post.mockResolvedValue({} as never);
    put.mockResolvedValue({} as never);
    await financeApi.requestPayout(125.5);
    await financeApi.setRefundDestination(7, "Test Bank", "Buyer", "12345");
    expect(post).toHaveBeenCalledWith("/sellers/me/payouts", { amount: 125.5 });
    expect(put).toHaveBeenCalledWith("/refunds/7/destination", {
      bankName: "Test Bank", accountName: "Buyer", accountNumber: "12345",
    });
  });

  it("requests wallet entries with page and size", async () => {
    get.mockResolvedValue({} as never);
    await financeApi.wallet(2, 20);
    expect(get).toHaveBeenCalledWith("/me/wallet?page=2&size=20");
  });
});
