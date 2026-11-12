import { describe, expect, it } from "vitest";
import {
  CONDITION_LABELS,
  formatPrice,
  productHref,
  PRODUCT_TYPE_LABELS,
  categoryLabel,
  localNameOnly,
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
    it("returns 'สินค้าหมด' when price is null or undefined", () => {
      expect(formatPrice(null)).toBe("สินค้าหมด");
      expect(formatPrice(undefined)).toBe("สินค้าหมด");
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
    it("maps all standard product types to labels in the current language", () => {
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

      expect(PRODUCT_TYPE_LABELS.SINGLE_CARD).toBe("การ์ดใบเดี่ยว");
      expect(PRODUCT_TYPE_LABELS.BOOSTER_BOX).toBe("กล่องสุ่ม");
    });
  });

  describe("categoryLabel [TCG-560]", () => {
    it("translates known category codes and falls back to the DB name", () => {
      expect(categoryLabel({ code: "SLEEVES", name: "x" })).toBe("ซองใส่การ์ด");
      expect(categoryLabel({ code: "NEW_THING", name: "หมวดใหม่" })).toBe("หมวดใหม่");
      expect(categoryLabel({ code: "toString", name: "หมวดใหม่" })).toBe("หมวดใหม่");
    });
  });

  describe("localNameOnly [TCG-560]", () => {
    it("shows the Thai local name only in Thai", () => {
      expect(localNameOnly("ซองสุ่ม FB07", "BOOSTER_PACK")).toBe("ซองสุ่ม FB07");
      document.documentElement.lang = "en";
      expect(localNameOnly("ชื่อไทยล้วน", "OTHER")).toBeNull();
      expect(localNameOnly("FB07", "OTHER")).toBe("FB07");
      document.documentElement.lang = "th";
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
      expect(CONDITION_LABELS.SEALED).toBe("ซีล");
    });
  });
});
