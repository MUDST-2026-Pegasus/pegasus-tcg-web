import { describe, expect, it } from "vitest";
import { getSellerPromotionErrors } from "@/features/seller/promotions/validation";
import type { SellerPromotionInput } from "@/features/seller/promotions/types";

const valid: SellerPromotionInput = {
  code: "STORE50", name: "Store promotion", description: null, discountType: "FIXED",
  discountValue: 50, maxDiscount: null, minSpend: 500, visibility: "PUBLIC", newBuyerOnly: false,
  usageLimitTotal: 100, usageLimitPerUser: 1, claimable: true, claimLimit: 100,
  featuredOnHome: false, startsAt: new Date(Date.now() + 86_400_000).toISOString(), endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
};

describe("seller promotion validation", () => {
  it("accepts a valid store code", () => expect(getSellerPromotionErrors(valid)).toEqual({}));

  it("rejects a fixed discount above minimum spend and an invalid period", () => {
    const errors = getSellerPromotionErrors({ ...valid, discountValue: 600, endsAt: new Date(Date.now() - 86_400_000).toISOString() });
    expect(errors.discountValue).toBeTruthy();
    expect(errors.endsAt).toBeTruthy();
  });

  it("does not let editing reduce quotas below redemptions and claims", () => {
    const errors = getSellerPromotionErrors({ ...valid, usageLimitTotal: 9, claimLimit: 7 }, { usedCount: 10, claimedCount: 8 });
    expect(errors.usageLimitTotal).toBeTruthy();
    expect(errors.claimLimit).toBeTruthy();
  });

  it("rejects reducing existing limits even when they remain above usage", () => {
    const errors = getSellerPromotionErrors({ ...valid, usageLimitTotal: 50, claimLimit: 50, endsAt: valid.startsAt }, {
      usedCount: 10, claimedCount: 8, usageLimitTotal: 100, claimLimit: 100, endsAt: valid.endsAt,
    });
    expect(errors.usageLimitTotal).toBeTruthy();
    expect(errors.claimLimit).toBeTruthy();
    expect(errors.endsAt).toBeTruthy();
  });
});
