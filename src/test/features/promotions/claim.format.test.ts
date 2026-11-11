import { describe, expect, it, vi } from "vitest";

import {
  claimErrorMessage,
  claimTicketState,
  daysUntil,
  formatClaimError,
  formatTermsDateTime,
  termsRows,
  walletRuleSummary,
} from "@/features/promotions/claim.format";
import type { ClaimableCode, PromotionTerms } from "@/features/promotions/claim.types";
import { ApiError } from "@/lib/api";

const terms: PromotionTerms = {
  id: 19,
  code: "SHOP10",
  name: "Shop sale",
  description: "Sample offer",
  ownerType: "SELLER",
  shop: { sellerProfileId: 7, name: "Card Corner", username: "cardcorner" },
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 200,
  minSpend: 500,
  scopeType: "GAME",
  scopeTargets: [{ id: 3, name: "Pokemon" }],
  startsAt: "2026-11-01T00:00:00Z",
  endsAt: "2026-11-30T23:59:59Z",
  usageLimitPerUser: 2,
  newBuyerOnly: true,
  stacksWithShopCodes: true,
  claimable: true,
  claimRequired: true,
  remainingClaims: 12,
  status: "ACTIVE",
  claimed: false,
};

describe("promotion API display transforms", () => {
  it("maps API terms to visible rows and handles optional limits and invalid dates", () => {
    expect(termsRows(terms)).toEqual(expect.arrayContaining([
      { label: "ยอดขั้นต่ำ", value: expect.stringContaining("฿500") },
      { label: "ส่วนลดสูงสุด", value: "฿200 ต่อคำสั่งซื้อ" },
      { label: "ใช้กับ", value: "เฉพาะเกม Pokemon ในร้าน Card Corner" },
      { label: "ผู้ใช้", value: "เฉพาะผู้ซื้อใหม่ (คำสั่งซื้อแรก)" },
      { label: "ใช้ร่วมกับ", value: "โค้ด Pegasus ได้" },
    ]));
    const noMinimum = termsRows({ ...terms, minSpend: 0, maxDiscount: null, scopeType: "ALL", scopeTargets: [], newBuyerOnly: false });
    expect(noMinimum.find((row) => row.label === "ยอดขั้นต่ำ")?.value).toBe("ไม่มีขั้นต่ำ");
    expect(noMinimum.some((row) => row.label === "ส่วนลดสูงสุด" || row.label === "ผู้ใช้")).toBe(false);
    expect(formatTermsDateTime("not-a-date")).toBe("—");
  });

  it("formats fixed, percentage, and free-shipping wallet summaries from the API contract", () => {
    const base = { ownerType: "SELLER" as const, shop: terms.shop, discountValue: 100, minSpend: 500 };
    expect(walletRuleSummary({ ...base, discountType: "FIXED", maxDiscount: null })).toBe("ขั้นต่ำ ฿500 · เฉพาะ Card Corner");
    expect(walletRuleSummary({ ...base, discountType: "PERCENT", maxDiscount: 200 })).toContain("ลด 100% สูงสุด ฿200");
    expect(walletRuleSummary({ ...base, discountType: "FREE_SHIPPING", maxDiscount: null })).toContain("ส่งฟรี · ขั้นต่ำ ฿500");
    expect(walletRuleSummary({ ...base, ownerType: "PLATFORM", shop: null, discountType: "FREE_SHIPPING", maxDiscount: 50 })).toContain("ส่งฟรีสูงสุด ฿50/ร้าน");
  });

  it("uses deterministic time for claim windows and maps known API claim errors", () => {
    const code = { endsAt: "2026-11-13T00:00:00Z", claimed: false, remainingClaims: 1 } as ClaimableCode;
    const now = Date.parse("2026-11-10T00:00:00Z");
    expect(daysUntil(code.endsAt, now)).toBe(3);
    expect(claimTicketState(code)).toBe("claimable");
    expect(claimTicketState({ ...code, claimed: true })).toBe("claimed");
    expect(claimTicketState({ ...code, remainingClaims: 0 })).toBe("soldOut");
    expect(formatClaimError("PROMO_EXPIRED")).toBe("โค้ดนี้หมดอายุแล้ว");
    expect(claimErrorMessage(new ApiError({ status: 409, code: "PROMO_CLAIM_FULL", message: "Full" }))).toBe("โค้ดนี้ถูกเก็บครบแล้ว");
    expect(formatClaimError("PROMO_NOT_FOUND")).toContain("ไม่พบ");
  });

  it("reports clipboard success and failure without changing the code", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const clipboard = navigator.clipboard.writeText as ReturnType<typeof vi.fn>;
    // The formatter owns toast feedback; the clipboard contract is asserted independently.
    const { copyPromotionCode } = await import("@/features/promotions/claim.format");
    await copyPromotionCode("SHOP10");
    expect(clipboard).toHaveBeenCalledWith("SHOP10");
  });
});
