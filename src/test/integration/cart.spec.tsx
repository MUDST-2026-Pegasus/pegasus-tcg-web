import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartPage } from "@/features/cart/pages/CartPage";
import { cartApi } from "@/features/cart/cart.api";
import type { CartResponse, CartItemResponse } from "@/features/cart/cart.types";
import { renderWithProviders } from "../utils";

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

vi.mock("@/features/cart/cart.api", () => ({
  cartApi: {
    getCart: vi.fn(),
    acceptPrices: vi.fn(),
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    mergeCart: vi.fn(),
  },
}));

function makeCartItem(overrides: Partial<CartItemResponse> = {}): CartItemResponse {
  return {
    id: 1,
    cartId: 10,
    listingId: 101,
    quantity: 1,
    unitPriceAtAdd: 500,
    currentPrice: 500,
    priceChanged: false,
    purchasable: true,
    quantityAvailable: 5,
    sellerProfileId: 1,
    catalogVariantId: 1,
    condition: "NM",
    currency: "THB",
    addedAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    productName: "Blue-Eyes White Dragon",
    variantLabel: "Ultra Rare",
    sellerName: "Kaiba Store",
    imageUrl: "https://example.com/blue-eyes.jpg",
    productId: 1,
    ...overrides,
  };
}

let mockCart: CartResponse;

describe("CartPage Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();

    mockCart = {
      id: 10,
      userId: 1,
      sessionKey: null,
      currency: "THB",
      items: [
        makeCartItem({
          id: 1,
          productName: "Blue-Eyes White Dragon",
          currentPrice: 500,
          quantity: 2,
          sellerProfileId: 1,
          sellerName: "Kaiba Store",
        }),
        makeCartItem({
          id: 2,
          productName: "Dark Magician",
          currentPrice: 300,
          quantity: 1,
          sellerProfileId: 2,
          sellerName: "Yugi Games",
        }),
      ],
      totalQuantity: 3,
      itemsSubtotal: 1300,
      expiresAt: null,
    };

    vi.mocked(cartApi.getCart).mockImplementation(() =>
      Promise.resolve({ ...mockCart, items: [...mockCart.items] }),
    );
    vi.mocked(cartApi.updateQuantity).mockImplementation((itemId, data) => {
      mockCart.items = mockCart.items.map((i) =>
        i.id === itemId ? { ...i, quantity: data.quantity } : i,
      );
      return Promise.resolve(mockCart.items.find((i) => i.id === itemId)!);
    });
    vi.mocked(cartApi.removeItem).mockImplementation((itemId) => {
      mockCart.items = mockCart.items.filter((i) => i.id !== itemId);
      return Promise.resolve();
    });
  });

  it("renders cart items and displays correct subtotal and estimated shipping", async () => {
    renderWithProviders(<CartPage />);

    expect(await screen.findByText("Blue-Eyes White Dragon")).toBeInTheDocument();
    expect(screen.getByText("Dark Magician")).toBeInTheDocument();
    expect(screen.getByText("Kaiba Store")).toBeInTheDocument();
    expect(screen.getByText("Yugi Games")).toBeInTheDocument();

    expect(screen.getByText("Subtotal (2 items)")).toBeInTheDocument();
    expect(screen.getByText("฿1,300")).toBeInTheDocument();
    expect(screen.getByText("฿100")).toBeInTheDocument();
    expect(screen.getByText("฿1,400")).toBeInTheDocument();
  });

  it("allows increasing and decreasing item quantity", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    expect(await screen.findByText("Blue-Eyes White Dragon")).toBeInTheDocument();

    const plusButtons = screen.getAllByRole("button").filter((btn) =>
      btn.querySelector("svg.lucide-plus"),
    );
    expect(plusButtons.length).toBeGreaterThan(0);

    await user.click(plusButtons[0]);

    await waitFor(() => {
      expect(cartApi.updateQuantity).toHaveBeenCalledWith(1, { quantity: 3 });
    });
  });

  it("removes an item when Remove button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    expect(await screen.findByText("Blue-Eyes White Dragon")).toBeInTheDocument();

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(2);

    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(cartApi.removeItem).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.queryByText("Blue-Eyes White Dragon")).not.toBeInTheDocument();
      expect(screen.getByText("Dark Magician")).toBeInTheDocument();
    });
  });

  it("renders empty cart state when cart has no items", async () => {
    mockCart.items = [];
    vi.mocked(cartApi.getCart).mockResolvedValueOnce(mockCart);

    renderWithProviders(<CartPage />);

    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore Products" })).toBeInTheDocument();
  });

  it("renders error state when cart fetch fails", async () => {
    vi.mocked(cartApi.getCart).mockRejectedValueOnce(new Error("Network Error"));

    renderWithProviders(<CartPage />);

    expect(await screen.findByText("Failed to load cart.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
