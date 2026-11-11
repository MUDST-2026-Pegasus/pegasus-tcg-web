import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartPage } from "@/features/cart/pages/CartPage";
import { cartApi } from "@/features/cart/cart.api";
import type { CartResponse, CartItemResponse } from "@/features/cart/cart.types";
import { renderWithProviders } from "../utils";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

// No promotions in this flow: the cart falls back to its own subtotal.
vi.mock("@/features/cart/checkout.api", () => ({
  checkoutApi: {
    getPromotions: vi.fn().mockResolvedValue([]),
    previewPromotions: vi.fn().mockRejectedValue(new Error("not under test")),
  },
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

  it("renders cart items per shop and the subtotal before shipping", async () => {
    renderWithProviders(<CartPage />);

    expect(await screen.findByText("Blue-Eyes White Dragon")).toBeInTheDocument();
    expect(screen.getByText("Dark Magician")).toBeInTheDocument();
    expect(screen.getByText("Kaiba Store")).toBeInTheDocument();
    expect(screen.getByText("Yugi Games")).toBeInTheDocument();

    expect(screen.getByText("ยอดสินค้า (3 ใบ)")).toBeInTheDocument();
    expect(screen.getByText("ค่าจัดส่ง").nextSibling).toHaveTextContent("คิดในหน้าถัดไป");
    expect(screen.getByLabelText("ยอดรวม")).toHaveTextContent("฿1,300");
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

  it("refreshes the rendered quantity and shop total from the updated cart response", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    await screen.findByText("Blue-Eyes White Dragon");
    await user.click(screen.getByRole("button", { name: "เพิ่มจำนวน Blue-Eyes White Dragon" }));

    await waitFor(() => {
      expect(screen.getByLabelText("จำนวน Blue-Eyes White Dragon")).toHaveTextContent("3");
      expect(screen.getByLabelText("ยอดรวม")).toHaveTextContent("฿1,800");
    });
    expect(cartApi.updateQuantity).toHaveBeenCalledWith(1, { quantity: 3 });
  });

  it("disables repeated quantity updates while pending and preserves the cart after insufficient-stock response", async () => {
    let rejectUpdate!: (reason: unknown) => void;
    const toastSpy = vi.mocked(toast.add);
    vi.mocked(cartApi.updateQuantity).mockImplementation(() => new Promise((_, reject) => { rejectUpdate = reject; }));
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    await screen.findByText("Blue-Eyes White Dragon");
    const increase = screen.getByRole("button", { name: "เพิ่มจำนวน Blue-Eyes White Dragon" });
    await user.click(increase);
    expect(increase).toBeDisabled();
    expect(cartApi.updateQuantity).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("จำนวน Blue-Eyes White Dragon")).toHaveTextContent("2");

    rejectUpdate(new ApiError({ status: 409, code: "INSUFFICIENT_STOCK", message: "Only 2 items remain" }));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ title: "สินค้าเหลือไม่พอ", type: "error" })));
    expect(screen.getByLabelText("จำนวน Blue-Eyes White Dragon")).toHaveTextContent("2");
    expect(screen.getByRole("button", { name: "เพิ่มจำนวน Blue-Eyes White Dragon" })).toBeEnabled();
  });

  it("removes an item when Remove button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CartPage />);

    expect(await screen.findByText("Blue-Eyes White Dragon")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ลบ Blue-Eyes White Dragon" }));

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

    expect(await screen.findByText("ยังไม่มีสินค้าในตะกร้า")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เลือกซื้อสินค้า" })).toBeInTheDocument();
  });

  it("renders error state when cart fetch fails", async () => {
    vi.mocked(cartApi.getCart).mockRejectedValueOnce(new Error("Network Error"));

    renderWithProviders(<CartPage />);

    expect(await screen.findByText("โหลดตะกร้าไม่สำเร็จ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ลองใหม่" })).toBeInTheDocument();
  });
});
