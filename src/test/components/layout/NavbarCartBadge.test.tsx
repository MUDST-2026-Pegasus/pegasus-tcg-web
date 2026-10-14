import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { Navbar } from "@/components/layout/Navbar";
import { cartApi } from "@/features/cart/cart.api";
import { cartKeys } from "@/features/cart/cart.queries";
import type { CartResponse } from "@/features/cart/cart.types";
import { createTestQueryClient, render } from "@/test/utils";

vi.mock("@/components/layout/AccountMenu", () => ({ AccountMenu: () => null }));

const getCart = vi.spyOn(cartApi, "getCart");
const emptyCart: CartResponse = {
  id: 1,
  userId: null,
  sessionKey: null,
  currency: "THB",
  items: [],
  totalQuantity: 0,
  itemsSubtotal: 0,
  expiresAt: null,
};

function renderNavbar() {
  const queryClient = createTestQueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

describe("Navbar cart badge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCart.mockResolvedValue(emptyCart);
  });

  it("hides the badge while loading", () => {
    getCart.mockReturnValue(new Promise(() => {}));
    renderNavbar();
    expect(screen.getByRole("button", { name: "ตะกร้าสินค้า" })).not.toHaveTextContent("0");
  });

  it("hides the badge when the cart is empty", async () => {
    renderNavbar();
    const button = await screen.findByRole("button", { name: "ตะกร้าสินค้า มีสินค้า 0 ชิ้น" });
    expect(button).not.toHaveTextContent("0");
  });

  it.each([[1, "1"], [9, "9"], [10, "10"], [99, "99"], [100, "99+"]])(
    "shows quantity %i as %s",
    async (quantity, label) => {
      getCart.mockResolvedValue({ ...emptyCart, totalQuantity: quantity });
      renderNavbar();
      const link = await screen.findByRole("button", { name: `ตะกร้าสินค้า มีสินค้า ${quantity} ชิ้น` });
      expect(link).toHaveTextContent(label);
      expect(link).toHaveAttribute("href", "/cart");
    },
  );

  it("updates from the shared cart query after a successful cart change", async () => {
    getCart.mockResolvedValueOnce({ ...emptyCart, totalQuantity: 2 });
    getCart.mockResolvedValueOnce({ ...emptyCart, totalQuantity: 5 });
    const queryClient = renderNavbar();
    expect(await screen.findByRole("button", { name: "ตะกร้าสินค้า มีสินค้า 2 ชิ้น" })).toBeInTheDocument();
    await queryClient.invalidateQueries({ queryKey: cartKeys.all });
    expect(await screen.findByRole("button", { name: "ตะกร้าสินค้า มีสินค้า 5 ชิ้น" })).toBeInTheDocument();
  });

  it("keeps the last confirmed quantity when refreshing the cart fails", async () => {
    getCart.mockResolvedValueOnce({ ...emptyCart, totalQuantity: 3 });
    getCart.mockRejectedValueOnce(new Error("Network error"));
    const queryClient = renderNavbar();
    const button = await screen.findByRole("button", { name: "ตะกร้าสินค้า มีสินค้า 3 ชิ้น" });
    await queryClient.invalidateQueries({ queryKey: cartKeys.all });
    expect(button).toHaveTextContent("3");
  });
});
