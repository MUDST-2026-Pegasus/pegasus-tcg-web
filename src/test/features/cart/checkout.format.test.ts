import { describe, expect, it } from "vitest";
import {
  checkoutMoney,
  findPromotionOwnerForCode,
  promotionOutcomeSlot,
  formatPromotionConditions,
  formatPromotionDate,
  formatPromotionError,
  formatPromotionRuleSummary,
  formatPromotionValue,
  normalizePromotionCode,
} from "@/features/cart/checkout.format";

describe("checkout.format", () => {
  describe("checkoutMoney", () => {
    it("formats baht amount with 2 decimal places max", () => {
      expect(checkoutMoney(0)).toBe("฿0");
      expect(checkoutMoney(1500)).toBe("฿1,500");
      expect(checkoutMoney(3025.5)).toBe("฿3,025.5");
    });
  });

  describe("normalizePromotionCode", () => {
    it("trims and converts to uppercase", () => {
      expect(normalizePromotionCode("  pegasus10 ")).toBe("PEGASUS10");
      expect(normalizePromotionCode("Store_a")).toBe("STORE_A");
    });
  });

  describe("promotionOutcomeSlot [TCG-769]", () => {
    const base = {
      code: "X", sellerName: null, status: "PROMO_NOT_FOUND", discount: null, shortfall: null, pendingShipping: false,
    };

    it("uses the slot the code was typed in, not its owner", () => {
      expect(promotionOutcomeSlot({ ...base, ownerType: "SELLER", sellerProfileId: 7,
        slotOwnerType: "PLATFORM", slotSellerProfileId: null })).toBe("PLATFORM");
      expect(promotionOutcomeSlot({ ...base, ownerType: "PLATFORM", sellerProfileId: null,
        slotOwnerType: "SELLER", slotSellerProfileId: 3 })).toBe(3);
      expect(promotionOutcomeSlot({ ...base, ownerType: null, sellerProfileId: null,
        slotOwnerType: "PLATFORM", slotSellerProfileId: null })).toBe("PLATFORM");
    });

    it("falls back to the owner on an older API, an ownerless code being Pegasus's slot", () => {
      expect(promotionOutcomeSlot({ ...base, ownerType: "PLATFORM", sellerProfileId: null })).toBe("PLATFORM");
      expect(promotionOutcomeSlot({ ...base, ownerType: "SELLER", sellerProfileId: 5 })).toBe(5);
      expect(promotionOutcomeSlot({ ...base, ownerType: null, sellerProfileId: null })).toBe("PLATFORM");
      expect(promotionOutcomeSlot({ ...base, ownerType: null, sellerProfileId: 9 })).toBe(9);
    });
  });

  describe("findPromotionOwnerForCode", () => {
    const selection = {
      platformCode: "PEGASUS10",
      sellerCodes: { 12: "SHOP12", 27: "SHOP27" },
    };

    it("finds platform and seller owners from the selection contract", () => {
      expect(findPromotionOwnerForCode("pegasus10", selection)).toBe("PLATFORM");
      expect(findPromotionOwnerForCode(" shop27 ", selection)).toBe(27);
      expect(findPromotionOwnerForCode("UNKNOWN", selection)).toBeNull();
    });
  });

  describe("formatPromotionValue", () => {
    it("formats percent, fixed, and free shipping", () => {
      expect(formatPromotionValue({ discountType: "FREE_SHIPPING", discountValue: 0 })).toBe("ส่งฟรี");
      expect(formatPromotionValue({ discountType: "PERCENT", discountValue: 15 })).toBe("15%");
      expect(formatPromotionValue({ discountType: "FIXED", discountValue: 100 })).toBe("฿100");
    });
  });

  describe("formatPromotionConditions", () => {
    it("formats minimum spend and maximum cap", () => {
      expect(formatPromotionConditions({ minSpend: 500, maxDiscount: 200 })).toBe("ขั้นต่ำ ฿500 · สูงสุด ฿200");
      expect(formatPromotionConditions({ minSpend: 0, maxDiscount: null })).toBe("ไม่มีขั้นต่ำ");
    });
  });

  describe("formatPromotionRuleSummary", () => {
    it("combines value and conditions", () => {
      expect(
        formatPromotionRuleSummary({
          discountType: "PERCENT",
          discountValue: 10,
          minSpend: 500,
          maxDiscount: 200,
        }),
      ).toBe("ลด 10% · ขั้นต่ำ ฿500 · สูงสุด ฿200");
    });
  });

  describe("formatPromotionDate", () => {
    it("formats Gregorian Thai date", () => {
      const formatted = formatPromotionDate("2026-11-30T00:00:00Z");
      expect(formatted).toMatch(/30\s+(พ\.ย\.|พฤศจิกายน)\s+2026/);
    });
  });

  describe("formatPromotionError", () => {
    it("maps all required error codes to Thai messages per spec", () => {
      expect(formatPromotionError("PROMO_EXPIRED")).toBe("โค้ดหมดอายุแล้ว");
      expect(formatPromotionError("PROMO_MIN_SPEND_NOT_MET", { shortfall: 150 })).toBe(
        "ซื้อสินค้าเพิ่มอีก ฿150 เพื่อใช้โค้ดนี้",
      );
      expect(formatPromotionError("PROMO_WRONG_SELLER", { sellerName: "Store A" })).toBe(
        "โค้ดนี้เป็นของร้าน Store A — ใส่ในช่อง “โค้ดร้าน” ของร้านนั้น",
      );
      expect(formatPromotionError("PROMO_USED_UP")).toBe("สิทธิ์ของโค้ดถูกใช้ครบแล้ว");
      expect(formatPromotionError("PROMO_USER_LIMIT_REACHED")).toBe("คุณใช้โค้ดนี้ครบจำนวนครั้งแล้ว");
      expect(formatPromotionError("PROMO_NOT_FOUND")).toBe("ไม่พบโค้ด ตรวจสอบตัวสะกดอีกครั้ง");
      expect(formatPromotionError("PROMO_NOT_STARTED", { startsAt: "2026-12-01T00:00:00Z" })).toMatch(
        /โค้ดใช้ได้ตั้งแต่วันที่/,
      );
      expect(formatPromotionError("PROMO_NOT_APPLICABLE")).toBe(
        "ไม่มีสินค้าในตะกร้าที่เข้าเงื่อนไขโค้ดนี้",
      );
      expect(formatPromotionError("PROMO_NOT_CLAIMED")).toBe("โค้ดนี้ต้องเก็บก่อนใช้งาน");
      expect(formatPromotionError("PROMO_CLAIM_FULL")).toBe("โค้ดถูกเก็บครบสิทธิ์แล้ว");
      expect(formatPromotionError("PROMO_PAUSED")).toBe("โค้ดถูกระงับชั่วคราว");
      expect(formatPromotionError("PROMO_CHANGED")).toBe("ยอดชำระเปลี่ยนไป");
    });
  });
});
