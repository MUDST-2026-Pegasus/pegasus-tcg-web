import { describe, expect, it } from "vitest";

import type { SellerListing } from "@/features/seller/products/products.types";
import { getRestockData } from "@/features/seller/products/restock.api";
import { calculateRestock } from "@/features/seller/products/restock.calc";
import type { RestockDraft } from "@/features/seller/products/restock.types";

function listing(overrides: Partial<SellerListing> = {}): SellerListing {
  return {
    id: 126,
    card: {
      variantId: 43,
      sku: "YUGIOH-RA03-EN080-EN-NORMAL",
      variantLabel: "EN / NORMAL / UNLIMITED",
      variantActive: true,
      productId: 9,
      productName: "Dark Magician",
      productSlug: "dark-magician-ra03-en080",
      gameId: 4,
      officialImageUrl: null,
    },
    condition: "LP",
    price: 3300,
    quantityAvailable: 3,
    costBasis: { quantity: 3, totalCost: 7500, averageUnitCost: 2500 },
    ...overrides,
  } as SellerListing;
}

function draft(quantity: string, totalCost: string): RestockDraft {
  return { quantity, totalCost, receivedAt: "2026-10-14", source: "other_shop", reference: "", note: "" };
}

describe("restock preview", () => {
  it("starts from the seller's real average cost, not zero", () => {
    const { product } = getRestockData(listing());

    expect(product).toMatchObject({ stock: 3, averageCost: 2500, costQuantity: 3, costTotal: 7500 });
  });

  it("weighs a new lot the way the backend will", () => {
    const data = getRestockData(listing());

    // 3 ใบ × ฿2,500 + 2 ใบ ฿6,000 = ฿13,500 ÷ 5 ใบ — ตัวเดียวกับที่ออเดอร์ใช้เป็นต้นทุนตอนขาย
    const result = calculateRestock(data.product, data.commissionPercent, draft("2", "6000"));

    expect(result).toMatchObject({
      previousValue: 7500,
      combinedValue: 13500,
      newCostQuantity: 5,
      newStock: 5,
      newAverageCost: 2700,
    });
  });

  it("counts every card the average covers, not just the ones on this listing", () => {
    // ประกาศนี้เหลือพร้อมขาย 2 ใบ แต่อีกใบติดจองอยู่ในออเดอร์ ต้นทุนยังรวมใบนั้น
    const data = getRestockData(
      listing({
        quantityAvailable: 2,
        costBasis: { quantity: 3, totalCost: 7500, averageUnitCost: 2500 },
      }),
    );

    const result = calculateRestock(data.product, data.commissionPercent, draft("1", "4500"));

    expect(result.newStock).toBe(3);
    expect(result.newCostQuantity).toBe(4);
    expect(result.newAverageCost).toBe(3000);
  });

  it("takes the first lot's cost as the average when nothing was stocked before", () => {
    const data = getRestockData(
      listing({ quantityAvailable: 0, costBasis: { quantity: 0, totalCost: 0, averageUnitCost: 0 } }),
    );

    const result = calculateRestock(data.product, data.commissionPercent, draft("4", "1000"));

    expect(result.newAverageCost).toBe(250);
  });
});
