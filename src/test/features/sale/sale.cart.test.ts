import { describe, expect, it } from "vitest";

import type { CartItemResponse } from "@/features/cart/cart.types";
import { cartSaleTotals, saleEndedInCart } from "@/features/sale/sale.cart";

const item = (overrides: Partial<CartItemResponse>): CartItemResponse => ({
  id: 1,
  cartId: 1,
  listingId: 1,
  quantity: 1,
  unitPriceAtAdd: 0,
  currentPrice: 0,
  priceChanged: false,
  purchasable: true,
  quantityAvailable: 3,
  sellerProfileId: 1,
  catalogVariantId: 1,
  condition: "NM",
  currency: "THB",
  addedAt: "",
  updatedAt: "",
  productName: "x",
  variantLabel: null,
  sellerName: null,
  imageUrl: null,
  productId: 1,
  ...overrides,
});

describe("cart sale rows (Figma SAL-B3 C)", () => {
  it("before-discount total and product discount come from API pricing", () => {
    const totals = cartSaleTotals([
      item({
        currentPrice: 3780,
        unitPriceAtAdd: 3780,
        pricing: { listPrice: 4200, salePrice: 3780, discountPercent: 10, sale: { id: 2, slug: "pm", name: "Pokémon Month", type: "CATEGORY_SALE", endsAt: "", quotaLeft: null, perBuyerLimit: null } },
      }),
      item({ id: 2, currentPrice: 1990, unitPriceAtAdd: 1393, priceChanged: true, pricing: null }),
    ]);
    expect(totals).toEqual({ listTotal: 6190, saleDiscount: 420, subtotal: 5770 });
  });

  it("flags a price rise caused by an ended sale", () => {
    expect(saleEndedInCart(item({ currentPrice: 1990, unitPriceAtAdd: 1393, priceChanged: true, pricing: null }))).toBe(true);
    // API ที่ยังไม่ส่ง pricing = การเปลี่ยนราคาทั่วไป
    expect(saleEndedInCart(item({ currentPrice: 1990, unitPriceAtAdd: 1393, priceChanged: true }))).toBe(false);
  });
});

it("charges regular prices above a Flash buyer limit", () => {
  expect(cartSaleTotals([item({ quantity: 3, currentPrice: 1995,
    pricing: { listPrice: 2850, salePrice: 1995, discountPercent: 30,
      sale: { id: 1, slug: "flash", name: "Flash", type: "FLASH_SALE", endsAt: "2099-01-01", quotaLeft: 10, perBuyerLimit: 1 } } })]))
    .toEqual({ listTotal: 8550, saleDiscount: 855, subtotal: 7695 });
});
