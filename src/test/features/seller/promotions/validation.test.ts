import { describe, expect, it } from "vitest";
import { getSellerPromotionErrors } from "@/features/seller/promotions/promotions.schema";
import type { SellerPromotionInput } from "@/features/seller/promotions/promotions.types";

const valid: SellerPromotionInput = {
  code: "SHOPTEST", name: "ทดสอบ", description: "", discountType: "FIXED",
  discountValue: 100, maxDiscount: null, minSpend: 500, visibility: "PUBLIC",
  newBuyerOnly: false, usageLimitTotal: 20, usageLimitPerUser: 1,
  claimable: true, claimLimit: 30,
  startsAt: new Date(Date.now() + 86_400_000).toISOString(), endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
};

describe("seller promotion validation", () => {
  it("accepts a valid store code", () => expect(getSellerPromotionErrors(valid)).toEqual({}));
  it("rejects a fixed discount greater than minimum spend", () => {
    expect(getSellerPromotionErrors({ ...valid, discountValue: 600 }).discountValue).toBeTruthy();
  });

  it("accepts any fixed discount when there is no minimum spend", () => {
    expect(getSellerPromotionErrors({ ...valid, minSpend: 0, discountValue: 50 })).toEqual({});
  });

  it("requires the end to follow the start", () => {
    expect(getSellerPromotionErrors({ ...valid, endsAt: new Date(Date.now() - 86_400_000).toISOString() }).endsAt).toBeTruthy();
  });

  it("cannot set total uses below uses already made", () => {
    expect(getSellerPromotionErrors({ ...valid, usageLimitTotal: 4 }, { usedCount: 5 }).usageLimitTotal).toBeTruthy();
  });

  it("cannot set claim limit below claims already made", () => {
    expect(getSellerPromotionErrors({ ...valid, claimLimit: 4 }, { claimedCount: 5 }).claimLimit).toBeTruthy();
  });

  it("rejects reducing existing limits or expiry after a code was used", () => {
    const errors = getSellerPromotionErrors({ ...valid, usageLimitTotal: 15, claimLimit: 20, endsAt: valid.startsAt }, {
      usedCount: 10, claimedCount: 8, usageLimitTotal: 20, claimLimit: 30, endsAt: valid.endsAt,
    });
    expect(errors.usageLimitTotal).toBeTruthy();
    expect(errors.claimLimit).toBeTruthy();
    expect(errors.endsAt).toBeTruthy();
  });
});
