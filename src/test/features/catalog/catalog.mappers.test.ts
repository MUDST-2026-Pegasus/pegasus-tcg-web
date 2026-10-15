import { describe, expect, it } from "vitest";
import {
  CONDITION_LABELS,
  formatPrice,
  productHref,
  PRODUCT_TYPE_LABELS,
} from "@/features/catalog/catalog.mappers";
import type { CardCondition, ProductType } from "@/features/catalog/catalog.types";

describe("catalog.mappers unit tests", () => {
  describe("productHref", () => {
    it("encodes slug into product URL path correctly", () => {
      expect(productHref("pikachu-ex-025")).toBe("/products/pikachu-ex-025");
    });

    it("handles URI encoding for special characters and spaces", () => {
      expect(productHref("card with spaces & symbols")).toBe(
        "/products/card%20with%20spaces%20%26%20symbols"
      );
    });
  });

  describe("formatPrice", () => {
    it("returns 'Out of stock' when price is null or undefined", () => {
      expect(formatPrice(null)).toBe("Out of stock");
      expect(formatPrice(undefined)).toBe("Out of stock");
    });

    it("formats 0 as zero Thai Baht currency", () => {
      const formatted = formatPrice(0);
      expect(formatted).toMatch(/0/);
      expect(formatted).toMatch(/฿|THB/);
    });

    it("formats positive numbers as localized Thai Baht without decimals", () => {
      const formatted = formatPrice(1500);
      expect(formatted).toMatch(/1,500/);
      expect(formatted).toMatch(/฿|THB/);
    });
  });

  describe("PRODUCT_TYPE_LABELS", () => {
    it("maps all standard product types to human-readable English labels", () => {
      const types: ProductType[] = [
        "SINGLE_CARD",
        "BOOSTER_PACK",
        "BOOSTER_BOX",
        "ELITE_TRAINER_BOX",
        "STARTER_DECK",
        "BUNDLE",
        "ACCESSORY",
        "OTHER",
      ];

      for (const type of types) {
        expect(PRODUCT_TYPE_LABELS[type]).toBeDefined();
        expect(typeof PRODUCT_TYPE_LABELS[type]).toBe("string");
      }

      expect(PRODUCT_TYPE_LABELS.SINGLE_CARD).toBe("Single Card");
      expect(PRODUCT_TYPE_LABELS.BOOSTER_BOX).toBe("Booster Box");
    });
  });

  describe("CONDITION_LABELS", () => {
    it("maps card condition codes to grading descriptions", () => {
      const conditions: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG", "SEALED"];

      for (const cond of conditions) {
        expect(CONDITION_LABELS[cond]).toBeDefined();
        expect(typeof CONDITION_LABELS[cond]).toBe("string");
      }

      expect(CONDITION_LABELS.NM).toBe("Near Mint");
      expect(CONDITION_LABELS.LP).toBe("Lightly Played");
      expect(CONDITION_LABELS.MP).toBe("Moderately Played");
      expect(CONDITION_LABELS.HP).toBe("Heavily Played");
      expect(CONDITION_LABELS.DMG).toBe("Damaged");
      expect(CONDITION_LABELS.SEALED).toBe("Sealed");
    });
  });
});
