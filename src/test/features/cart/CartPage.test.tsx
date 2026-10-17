import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";

import { cartApi } from "@/features/cart/cart.api";
import { CartPage } from "@/features/cart/pages/CartPage";
import type { CartResponse } from "@/features/cart/cart.types";
import { createTestQueryClient, render } from "@/test/utils";
import { toast } from "@/components/ui/toast";

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
      sellerUsername: "seller_store",
      imageUrl: null,
      productId: 1,
    },
  ],
};

describe("CartPage item details", () => {
  const getCart = vi.spyOn(cartApi, "getCart");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());
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

  function renderCart() {
    return render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter><CartPage /></MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("opens the clicked seller's profile when shops have the same display name", async () => {
    const user = userEvent.setup();
    getCart.mockResolvedValue({ ...cart, items: [
      { ...cart.items[0], sellerUsername: "shop_one" },
      { ...cart.items[0], id: 11, listingId: 56, sellerProfileId: 6, sellerUsername: "shop_two" },
    ] });
    function SellerProfile() {
      const { username } = useParams();
      return <h1>Store profile: {username}</h1>;
    }
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/u/:username" element={<SellerProfile />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const sellers = await screen.findAllByRole("link", { name: "Seller Store" });
    expect(sellers[0]).toHaveAttribute("href", "/u/shop_one");
    expect(sellers[1]).toHaveAttribute("href", "/u/shop_two");
    await user.click(sellers[1]);
    expect(await screen.findByRole("heading", { name: "Store profile: shop_two" })).toBeInTheDocument();
  });

  it("shows the seller name without a broken link when username is missing", async () => {
    getCart.mockResolvedValue({ ...cart, items: [{ ...cart.items[0], sellerUsername: null }] });
    renderCart();
    expect(await screen.findByText("Seller Store")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Seller Store" })).not.toBeInTheDocument();
  });

  it.each([80, 120])("requires explicit acceptance of a changed price (%s) before checkout", async (price) => {
    const user = userEvent.setup();
    const changedCart = { ...cart, items: [{ ...cart.items[0], currentPrice: price, priceChanged: true }] };
    const acceptedCart = { ...cart, itemsSubtotal: price, items: [{ ...changedCart.items[0], unitPriceAtAdd: price, priceChanged: false }] };
    getCart.mockResolvedValue(changedCart);
    const accept = vi.spyOn(cartApi, "acceptPrices").mockImplementation(async () => {
      getCart.mockResolvedValue(acceptedCart);
      return acceptedCart;
    });
    renderCart();
    expect(await screen.findByText("ราคาสินค้าบางรายการเปลี่ยนแปลง")).toBeInTheDocument();
    expect(screen.getByText(`Price updated: ฿100 → ฿${price}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Proceed to Checkout" })).toBeDisabled();
    expect(screen.getByText("กรุณายอมรับราคาใหม่ หรือยกเลิกเลือกรายการที่ราคาเปลี่ยนก่อนสั่งซื้อ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ยอมรับราคาใหม่" }));
    expect(accept).toHaveBeenCalledWith([10]);
    await waitFor(() => expect(screen.getByRole("button", { name: "Proceed to Checkout" })).toBeEnabled());
    expect(screen.queryByText(/Price updated:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ยอมรับราคาใหม่" })).not.toBeInTheDocument();
    expect(screen.getByText(`฿${price + 50}`)).toBeInTheDocument();
  });

  it.each([
    { priceChanged: true, purchasable: true },
    { priceChanged: false, purchasable: false },
  ])("allows other items to checkout after deselecting a blocked item: %j", async (flags) => {
    const user = userEvent.setup();
    getCart.mockResolvedValue({ ...cart, items: [
      { ...cart.items[0], ...flags },
      { ...cart.items[0], id: 11, productName: "Charizard" },
    ] });
    renderCart();
    await screen.findByRole("heading", { name: "Pikachu ex" });
    expect(screen.getByRole("button", { name: "Proceed to Checkout" })).toBeDisabled();
    if (!flags.purchasable) expect(screen.getByText("กรุณานำสินค้าที่ไม่พร้อมจำหน่ายออก หรือยกเลิกเลือกก่อนสั่งซื้อ")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "เลือก Pikachu ex" }));
    expect(screen.getByRole("button", { name: "Proceed to Checkout" })).toBeEnabled();
  });

  it("keeps checkout blocked when accepting prices fails", async () => {
    const user = userEvent.setup();
    getCart.mockResolvedValue({ ...cart, items: [{ ...cart.items[0], priceChanged: true, currentPrice: 80 }] });
    vi.spyOn(cartApi, "acceptPrices").mockRejectedValue(new Error("offline"));
    renderCart();
    await user.click(await screen.findByRole("button", { name: "ยอมรับราคาใหม่" }));
    await waitFor(() => expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ title: "ยอมรับราคาใหม่ไม่สำเร็จ" })));
    expect(screen.getByRole("button", { name: "Proceed to Checkout" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ยอมรับราคาใหม่" })).toBeEnabled();
  });
});
