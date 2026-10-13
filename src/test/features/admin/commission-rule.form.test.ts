import { describe, expect, it } from "vitest";
import {
  blankDraft, conflictingRules, draftFromRule, draftToInput, feeBreakdown, ruleStatus, validateDraft,
} from "@/features/admin/commission-rule.form";
import type { CommissionRule } from "@/features/finance/after-sales.types";

const rule: CommissionRule = { id: 1, scope: "GAME", gameId: 4, categoryId: null, sellerProfileId: null,
  ratePercent: 7, fixedFee: 0, minFee: null, maxFee: null, priority: 0,
  effectiveFrom: "2026-10-01T00:00:00Z", effectiveTo: null, active: true };

describe("commission rule form", () => {
  it("rounds the percent part like CommissionCalculator before adding the fixed fee", () => {
    expect(feeBreakdown(1290, { ratePercent: 5, fixedFee: 0, minFee: null, maxFee: null }))
      .toEqual({ percentPart: 64.5, fixedFee: 0, fee: 64.5, clamped: null, sellerNet: 1225.5 });
    expect(feeBreakdown(99.99, { ratePercent: 3.333, fixedFee: 1, minFee: null, maxFee: null }).fee).toBe(4.33);
  });

  it("clamps to min, max and never above the price", () => {
    expect(feeBreakdown(100, { ratePercent: 5, fixedFee: 0, minFee: 20, maxFee: null })).toMatchObject({ fee: 20, clamped: "min" });
    expect(feeBreakdown(10000, { ratePercent: 5, fixedFee: 0, minFee: null, maxFee: 300 })).toMatchObject({ fee: 300, clamped: "max" });
    expect(feeBreakdown(10, { ratePercent: 0, fixedFee: 25, minFee: null, maxFee: null })).toMatchObject({ fee: 10, clamped: "price", sellerNet: 0 });
  });

  it("validates the same limits as the backend", () => {
    const draft = { ...blankDraft("SELLER"), ratePercent: "100.0001", fixedFee: "1.001", priority: "40000", sellerProfileId: "abc" };
    expect(Object.keys(validateDraft(draft)).sort()).toEqual(["fixedFee", "priority", "ratePercent", "target"]);
    expect(validateDraft({ ...blankDraft("GLOBAL"), ratePercent: "5" })).toEqual({});
    expect(validateDraft({ ...blankDraft("GLOBAL"), ratePercent: "5", effectiveFrom: "2026-10-10T10:00", effectiveTo: "2026-10-10T09:00" }))
      .toHaveProperty("effectiveTo");
  });

  it("only sends the target id that belongs to the scope", () => {
    const input = draftToInput({ ...draftFromRule(rule), scope: "CATEGORY", categoryId: 7 });
    expect(input).toMatchObject({ scope: "CATEGORY", gameId: null, categoryId: 7, sellerProfileId: null, minFee: null });
    expect(new Date(input.effectiveFrom).getTime()).toBe(new Date(rule.effectiveFrom).getTime());
  });

  it("reports status and overlapping active rules for the same target", () => {
    const now = new Date("2026-10-14T00:00:00Z");
    expect(ruleStatus(rule, now)).toBe("ACTIVE");
    expect(ruleStatus({ ...rule, effectiveFrom: "2026-11-01T00:00:00Z" }, now)).toBe("SCHEDULED");
    expect(ruleStatus({ ...rule, effectiveTo: "2026-10-02T00:00:00Z" }, now)).toBe("EXPIRED");
    expect(ruleStatus({ ...rule, active: false }, now)).toBe("INACTIVE");
    const input = draftToInput({ ...draftFromRule(rule), ratePercent: "8" });
    expect(conflictingRules(input, [rule], null).map((item) => item.id)).toEqual([1]);
    expect(conflictingRules(input, [rule], 1)).toEqual([]);
    expect(conflictingRules({ ...input, gameId: 5 }, [rule], null)).toEqual([]);
  });
});
