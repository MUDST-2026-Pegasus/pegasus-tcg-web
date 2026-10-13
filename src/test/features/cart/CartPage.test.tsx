import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { cartApi } from "@/features/cart/cart.api";
import { CartPage } from "@/features/cart/pages/CartPage";
import type { CartResponse } from "@/features/cart/cart.types";
import { createTestQueryClient, render } from "@/test/utils";

const cart: CartResponse = {
  id: 1,
  userId: null,
  sessionKey: "guest-session",
  currency: "THB",
  totalQuantity: 1,
  itemsSubtotal: 100,
  expiresAt: null,
  items: [
    {
      id: 10,
      cartId: 1,
      listingId: 55,
      quantity: 1,
      unitPriceAtAdd: 100,
      currentPrice: 100,
      priceChanged: false,
      purchasable: true,
      quantityAvailable: 2,
      sellerProfileId: 5,
      catalogVariantId: 15,
      condition: "NM",
      currency: "THB",
      addedAt: "2026-10-12T00:00:00Z",
      updatedAt: "2026-10-12T00:00:00Z",
      productName: "Pikachu ex",
      variantLabel: "English / Holo",
      sellerName: "Seller Store",
      imageUrl: null,
      productId: 1,
    },
  ],
};

describe("CartPage item details", () => {
  const getCart = vi.spyOn(cartApi, "getCart");

  beforeEach(() => {
    vi.clearAllMocks();
    getCart.mockResolvedValue(cart);
  });

  it("shows product name, selected condition, and seller", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <CartPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Pikachu ex" })).toBeInTheDocument();
    expect(screen.getByText("English / Holo")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent?.includes("Near Mint") === true)).toBeInTheDocument();
    expect(screen.getByText("Seller Store")).toBeInTheDocument();
  });
});
