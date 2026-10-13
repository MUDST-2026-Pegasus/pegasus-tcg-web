import { beforeEach, describe, expect, it, vi } from "vitest";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);
const remove = vi.mocked(api.delete);
beforeEach(() => { vi.clearAllMocks(); get.mockResolvedValue({} as never); post.mockResolvedValue({} as never); put.mockResolvedValue({} as never); remove.mockResolvedValue({} as never); });

describe("TCG-394 remaining API contracts", () => {
  it("connects all five commission rule operations", async () => {
    const rule = { scope: "GLOBAL" as const, gameId: null, categoryId: null, sellerProfileId: null,
      ratePercent: 5, fixedFee: 0, minFee: null, maxFee: null, priority: 0,
      effectiveFrom: "2026-10-13T00:00:00Z", effectiveTo: null, active: true };
    await afterSalesApi.commissionRules(); await afterSalesApi.commissionRule(9);
    await afterSalesApi.createCommissionRule(rule); await afterSalesApi.updateCommissionRule(9, rule);
    await afterSalesApi.deactivateCommissionRule(9);
    expect(get).toHaveBeenNthCalledWith(1, "/admin/commission-rules");
    expect(get).toHaveBeenNthCalledWith(2, "/admin/commission-rules/9");
    expect(post).toHaveBeenCalledWith("/admin/commission-rules", rule);
    expect(put).toHaveBeenCalledWith("/admin/commission-rules/9", rule);
    expect(remove).toHaveBeenCalledWith("/admin/commission-rules/9");
  });

  it("reads and updates the platform fallback rate", async () => {
    await afterSalesApi.defaultCommissionRate();
    await afterSalesApi.updateDefaultCommissionRate(6.5);
    expect(get).toHaveBeenCalledWith("/admin/settings/commission.default_rate");
    expect(put).toHaveBeenCalledWith("/admin/settings/commission.default_rate", { value: "6.5" });
  });

  it("uses seller-order and return IDs for all seven return operations", async () => {
    const input = { reasonCode: "DAMAGED", description: "damaged card", evidenceKeys: ["returns/photo.png"], items: [{ orderItemId: 23, quantity: 1 }] };
    await afterSalesApi.buyerReturns(11); await afterSalesApi.requestReturn(11, input);
    await afterSalesApi.shipReturn(11, 12, "TH123"); await afterSalesApi.sellerReturns("REQUESTED");
    await afterSalesApi.approveReturn(12, "FULL_REFUND", 99, true);
    await afterSalesApi.rejectReturn(12); await afterSalesApi.receiveReturn(12, false);
    expect(get).toHaveBeenNthCalledWith(1, "/orders/11/returns");
    expect(post).toHaveBeenNthCalledWith(1, "/orders/11/returns", input);
    expect(post).toHaveBeenNthCalledWith(2, "/orders/11/returns/12/ship", { trackingNumber: "TH123" });
    expect(get).toHaveBeenNthCalledWith(2, "/sellers/me/returns", { query: { status: "REQUESTED" } });
    expect(post).toHaveBeenNthCalledWith(3, "/sellers/me/returns/12/approve", { resolution: "FULL_REFUND", refundAmount: 99, requireShipBack: true });
    expect(post).toHaveBeenNthCalledWith(4, "/sellers/me/returns/12/reject");
    expect(post).toHaveBeenNthCalledWith(5, "/sellers/me/returns/12/receive", { restock: false });
  });

  it("loads seller evidence through the owned return endpoint", async () => {
    await afterSalesApi.sellerReturnEvidence(12);
    expect(get).toHaveBeenCalledWith("/sellers/me/returns/12/evidence");
  });

  it("connects review operations and the buyer's saved review", async () => {
    await afterSalesApi.createReview(11, 5, "Great", "Excellent seller");
    await afterSalesApi.myReview(11);
    await afterSalesApi.publicReviews("seller.th");
    await afterSalesApi.replyReview(3, "Thank you");
    expect(post).toHaveBeenNthCalledWith(1, "/orders/11/reviews", { rating: 5, title: "Great", comment: "Excellent seller" });
    expect(get).toHaveBeenCalledWith("/orders/11/reviews/mine");
    expect(get).toHaveBeenCalledWith("/u/seller.th/reviews");
    expect(post).toHaveBeenNthCalledWith(2, "/sellers/me/reviews/3/reply", { comment: "Thank you" });
  });
});
