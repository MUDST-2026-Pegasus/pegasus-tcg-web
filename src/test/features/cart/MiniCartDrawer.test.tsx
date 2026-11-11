import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";

import { miniCartStore } from "@/features/cart/mini-cart.store";
import * as cartQueries from "@/features/cart/cart.queries";
import * as catalogQueries from "@/features/catalog/catalog.queries";
import { MiniCartDrawer } from "@/features/cart/components/MiniCartDrawer";
import { miniCartText } from "@/features/cart/mini-cart.messages";
import type { CartItemResponse } from "@/features/cart/cart.types";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/cart/cart.queries", () => ({
  useMiniCartQuery: vi.fn(),
  useAddCartItem: vi.fn(),
}));
vi.mock("@/features/catalog/catalog.queries", () => ({
  useSellerListings: vi.fn(),
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const item = (overrides: Partial<CartItemResponse> = {}): CartItemResponse => ({
  id: 1,
  cartId: 1,
  listingId: 101,
  quantity: 2,
  unitPriceAtAdd: 500,
  currentPrice: 500,
  priceChanged: false,
  purchasable: true,
  quantityAvailable: 5,
  sellerProfileId: 10,
  catalogVariantId: 5,
  condition: "NM",
  currency: "THB",
  addedAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  productName: "Blue-Eyes",
  variantLabel: "English / Holo",
  sellerName: "Kaiba Store",
  sellerUsername: "kaiba",
  imageUrl: null,
  productId: 1,
  ...overrides,
});

function renderDrawer() {
  miniCartStore.close();
  const view = renderWithProviders(
    <Routes>
      <Route path="/" element={<MiniCartDrawer />} />
      <Route path="/cart" element={<h1>Cart page</h1>} />
      <Route path="/checkout" element={<h1>Checkout page</h1>} />
    </Routes>,
  );
  act(() => miniCartStore.open({ listingId: 101, previousQuantity: 1, trigger: null }));
  return view;
}

describe("MiniCartDrawer component states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    miniCartStore.close();
    vi.mocked(cartQueries.useAddCartItem).mockReturnValue({ isPending: false, mutateAsync: vi.fn() } as never);
    vi.mocked(catalogQueries.useSellerListings).mockReturnValue({ data: { items: [] } } as never);
    vi.mocked(cartQueries.useMiniCartQuery).mockReturnValue({
      data: { items: [item(), item({ id: 2, listingId: 202, sellerProfileId: 20, sellerName: "Yugi Games", sellerUsername: "yugi", productName: "Dark Magician", quantity: 1, unitPriceAtAdd: 300, currentPrice: 300 })] },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
  });

  it("renders recent-item summary, groups the full cart by shop, and keeps checkout tied to purchasable items", async () => {
    renderDrawer();

    expect(await screen.findByText(miniCartText.updated)).toBeInTheDocument();
    expect(screen.getByText("Kaiba Store")).toBeInTheDocument();
    expect(screen.getByText("Yugi Games")).toBeInTheDocument();
    expect(screen.getAllByText("Blue-Eyes")).toHaveLength(2);
    expect(screen.getByText("Dark Magician")).toBeInTheDocument();
    expect(screen.getByText(miniCartText.count(3, 2))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: miniCartText.checkout })).toHaveAttribute("href", "/checkout?items=1,2");
  });

  it("shows loading, retryable error, and empty-cart states", async () => {
    vi.mocked(cartQueries.useMiniCartQuery).mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: vi.fn() } as never);
    const loadingView = renderDrawer();
    expect(await screen.findByRole("status")).toHaveTextContent(miniCartText.loading);
    loadingView.unmount();

    const refetch = vi.fn();
    vi.mocked(cartQueries.useMiniCartQuery).mockReturnValue({ data: undefined, isPending: false, isError: true, refetch } as never);
    const errorView = renderDrawer();
    await userEvent.setup().click(await screen.findByRole("button", { name: miniCartText.retry }));
    expect(refetch).toHaveBeenCalledTimes(1);
    errorView.unmount();

    vi.mocked(cartQueries.useMiniCartQuery).mockReturnValue({ data: { items: [] }, isPending: false, isError: false, refetch } as never);
    renderDrawer();
    expect(await screen.findByText(miniCartText.empty)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: miniCartText.checkout })).not.toBeInTheDocument();
  });

  it("flags unavailable lines for review and removes the checkout action", async () => {
    vi.mocked(cartQueries.useMiniCartQuery).mockReturnValue({
      data: { items: [item({ purchasable: false, priceChanged: true })] },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    renderDrawer();

    expect(await screen.findByRole("alert")).toHaveTextContent(miniCartText.attention(1));
    expect(screen.getAllByText(miniCartText.unavailable)).toHaveLength(2);
    expect(screen.getByRole("button", { name: miniCartText.review })).toHaveAttribute("href", "/cart");
    expect(screen.queryByRole("button", { name: miniCartText.checkout })).not.toBeInTheDocument();
  });
});
