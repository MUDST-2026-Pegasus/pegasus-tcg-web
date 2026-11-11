import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { CartSellerGroup } from "@/features/cart/components/CartSellerGroup";
import type { CartItemResponse } from "@/features/cart/cart.types";

const item: CartItemResponse = {
  id: 7, cartId: 1, listingId: 71, quantity: 2, unitPriceAtAdd: 500, currentPrice: 500,
  priceChanged: false, purchasable: true, quantityAvailable: 2, sellerProfileId: 9,
  catalogVariantId: 4, condition: "NM", currency: "THB", addedAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z", productName: "Dragon", variantLabel: "Holo",
  sellerName: "Card Shop", sellerUsername: null, imageUrl: null, productId: 2,
};

describe("CartSellerGroup row actions", () => {
  it("disables quantity controls at limits or while busy, and routes valid actions to the selected item", () => {
    const onQuantity = vi.fn();
    const onRemove = vi.fn();
    const { rerender } = render(
      <CartSellerGroup sellerName="Card Shop" items={[item]} selectedIds={new Set([7])}
        onToggleItem={vi.fn()} onToggleSeller={vi.fn()} onQuantity={onQuantity} onRemove={onRemove} subtotal={1000} />,
    );
    const decrement = screen.getByRole("button", { name: "ลดจำนวน Dragon" });
    const increment = screen.getByRole("button", { name: "เพิ่มจำนวน Dragon" });
    expect(increment).toBeDisabled();
    fireEvent.click(decrement);
    expect(onQuantity).toHaveBeenCalledWith(7, 1);
    fireEvent.click(screen.getByRole("button", { name: "ลบ Dragon" }));
    expect(onRemove).toHaveBeenCalledWith(7);

    rerender(
      <CartSellerGroup sellerName="Card Shop" items={[item]} selectedIds={new Set()}
        onToggleItem={vi.fn()} onToggleSeller={vi.fn()} onQuantity={onQuantity} onRemove={onRemove}
        quantityBusy removeBusy subtotal={1000} />,
    );
    expect(screen.getByRole("button", { name: "ลดจำนวน Dragon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "เพิ่มจำนวน Dragon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ลบ Dragon" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "เลือกทั้งร้าน Card Shop" })).not.toBeChecked();
  });
});
