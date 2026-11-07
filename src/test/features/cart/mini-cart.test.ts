import { describe, expect, it, vi } from "vitest";
import {
  groupMiniCart,
  miniCartSummary,
} from "@/features/cart/mini-cart.format";
import type { CartItemResponse } from "@/features/cart/cart.types";
const item = (overrides: Partial<CartItemResponse> = {}): CartItemResponse => ({
  id: 1,
  cartId: 1,
  listingId: 1,
  quantity: 1,
  unitPriceAtAdd: 100,
  currentPrice: 100,
  priceChanged: false,
  purchasable: true,
  quantityAvailable: 3,
  sellerProfileId: 1,
  catalogVariantId: 1,
  condition: "NM",
  currency: "THB",
  addedAt: "",
  updatedAt: "",
  productName: "Card",
  variantLabel: "EN",
  sellerName: "Shop",
  sellerUsername: "shop",
  imageUrl: null,
  productId: 1,
  ...overrides,
});
const pricing = {
  listPrice: 100,
  salePrice: 70,
  discountPercent: 30,
  sale: {
    id: 1,
    slug: "flash",
    name: "Flash",
    type: "FLASH_SALE" as const,
    endsAt: "2099-01-01",
    quotaLeft: 20,
    perBuyerLimit: 2,
  },
};
describe("mini-cart rules", () => {
  it("groups by seller identity even when display names match", () => {
    const groups = groupMiniCart([
      item(),
      item({ id: 2, sellerProfileId: 2, sellerUsername: "shop2" }),
      item({ id: 3 }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].items.map((i) => i.id)).toEqual([1, 3]);
  });
  it("selects Added, Sale, Qty updated and Needs attention with correct precedence", () => {
    expect(miniCartSummary([item()]).state).toBe("added");
    expect(miniCartSummary([item({ pricing })]).state).toBe("sale");
    expect(miniCartSummary([item({ pricing })], 1).state).toBe("updated");
    expect(
      miniCartSummary([item({ priceChanged: true, pricing })], 1).state,
    ).toBe("attention");
    expect(miniCartSummary([item({ purchasable: false })]).state).toBe(
      "attention",
    );
  });
  it("excludes unavailable products from totals and discounts", () => {
    const result = miniCartSummary([
      item({ quantity: 2, pricing }),
      item({ id: 2, currentPrice: 900, purchasable: false }),
      item({ id: 3, currentPrice: 50 }),
    ]);
    expect(result).toMatchObject({
      listTotal: 250,
      saleDiscount: 60,
      subtotal: 190,
      attention: 1,
      quantity: 4,
      shops: 1,
    });
  });
  it("uses current server prices for changed items and safely handles an empty cart", () => {
    expect(
      miniCartSummary([
        item({ currentPrice: 150, priceChanged: true, pricing: null }),
      ]).subtotal,
    ).toBe(150);
    expect(miniCartSummary([])).toMatchObject({
      subtotal: 0,
      quantity: 0,
      attention: 0,
      shops: 0,
    });
  });
});

it("quick-add toast reports the new addition rather than aggregate cart quantity", async () => {
  const { quickCartToast } = await import("@/components/common/quick-cart-toast");
  const { notifyQuickAdded } = await import("@/features/cart/mini-cart.notify");
  const add = vi.spyOn(quickCartToast, "add").mockReturnValue("test");
  notifyQuickAdded(item({ quantity: 3 }), () => {});
  expect(add).toHaveBeenCalledWith(expect.objectContaining({ description: "Card · ฿100" }));
  add.mockRestore();
});
