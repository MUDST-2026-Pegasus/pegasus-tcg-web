import { describe, expect, it } from "vitest";
import { getAdminPromotionErrors } from "@/features/admin/promotions/validation";
import type { AdminPromotionInput } from "@/features/admin/promotions/types";

const valid: AdminPromotionInput = {
  code: "PEGASUS10", name: "Weekend", description: null, discountType: "PERCENT",
  discountValue: 10, maxDiscount: 200, minSpend: 500, scopeType: "ALL", scopeIds: [],
  visibility: "PUBLIC", newBuyerOnly: false, usageLimitTotal: 100, usageLimitPerUser: 1,
  startsAt: new Date(Date.now() + 86_400_000).toISOString(), endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  claimable: true, claimRequired: false, claimLimit: 100, featuredOnHome: true, homeSort: null,
};

describe("admin promotion validation", () => {
  it("accepts a valid code", () => expect(getAdminPromotionErrors(valid)).toEqual({}));

  it("accepts only positions in the eight-code home strip", () => {
    expect(getAdminPromotionErrors({ ...valid, homeSort: 7 })).toEqual({});
    expect(getAdminPromotionErrors({ ...valid, homeSort: 8 }).homeSort).toBeTruthy();
  });

  it("rejects a percentage above 90 and an end before the start", () => {
    const errors = getAdminPromotionErrors({ ...valid, discountValue: 91, endsAt: new Date(Date.now() - 86_400_000).toISOString() });
    expect(errors.discountValue).toBeTruthy();
    expect(errors.endsAt).toBeTruthy();
  });

  it("preserves quotas already used or claimed while editing", () => {
    const errors = getAdminPromotionErrors({ ...valid, usageLimitTotal: 9, claimLimit: 7 }, { usedCount: 10, claimedCount: 8 });
    expect(errors.usageLimitTotal).toBeTruthy();
    expect(errors.claimLimit).toBeTruthy();
  });

  it("rejects reducing existing limits after orders and claims", () => {
    const errors = getAdminPromotionErrors({ ...valid, usageLimitTotal: 50, claimLimit: 50, claimRequired: true, endsAt: valid.startsAt }, {
      usedCount: 10, claimedCount: 8, usageLimitTotal: 100, claimLimit: 100,
      claimRequired: false, endsAt: valid.endsAt,
    });
    expect(errors.usageLimitTotal).toBeTruthy();
    expect(errors.claimLimit).toBeTruthy();
    expect(errors.claimRequired).toBeTruthy();
    expect(errors.endsAt).toBeTruthy();
  });
});
