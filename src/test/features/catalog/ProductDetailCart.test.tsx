import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";

import { cartApi } from "@/features/cart/cart.api";
import * as authQueries from "@/features/auth/auth.queries";
import * as catalogQueries from "@/features/catalog/catalog.queries";
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage";
import { createTestQueryClient } from "@/test/utils";

const product = {
  product: {
    id: 1,
    gameId: 1,
    categoryId: 1,
    cardSetId: null,
    productType: "SINGLE_CARD" as const,
    name: "Pikachu ex",
    nameLocal: null,
    slug: "pikachu-ex",
    cardNumber: "025/187",
    rarityCode: "Double Rare",
    description: null,
    attributes: {},
    active: true,
  },
  variants: [],
  images: [],
};

const listing = {
  id: 55,
  card: {
    variantId: 10,
    sku: "PIK-025",
    variantLabel: "English / Holo",
    productId: 1,
    productName: "Pikachu ex",
    productSlug: "pikachu-ex",
    gameId: 1,
    officialImageUrl: null,
  },
  condition: "NM" as const,
  price: 100,
  currency: "THB",
  quantityAvailable: 3,
  primaryPhotoUrl: null,
  seller: { username: "seller", displayName: "Seller", avatarUrl: null },
};

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/products/pikachu-ex"]}>
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutTarget />} />
          <Route path="/login" element={<p>Login reached</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function CheckoutTarget() {
  const [params] = useSearchParams();
  return <p>Checkout reached {params.toString()}</p>;
}

describe("ProductDetailPage cart actions", () => {
  const addItem = vi.spyOn(cartApi, "addItem");
  const authSpy = vi.spyOn(authQueries, "useAuth");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(catalogQueries, "useProductDetail").mockReturnValue({
      data: product,
      isPending: false,
      isError: false,
    } as never);
    vi.spyOn(catalogQueries, "useProductListings").mockReturnValue({
      data: [listing],
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as never);
    vi.spyOn(catalogQueries, "useProductCollectors").mockReturnValue({
      data: { items: [], totalItems: 0, totalPages: 0 },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.spyOn(catalogQueries, "useProductCardEffects").mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.spyOn(catalogQueries, "useGameList").mockReturnValue({
      data: [],
    } as never);
    authSpy.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      roles: [],
      hasRole: () => false,
    });
    addItem.mockResolvedValue({ id: 900 } as never);
  });

  it("adds the selected quantity to the cheapest available listing", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "เพิ่มจำนวนสินค้า" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith({ listingId: 55, quantity: 2 });
    });
  });

  it("caps the selected quantity at the listing stock", () => {
    renderPage();

    const increase = screen.getByRole("button", { name: "เพิ่มจำนวนสินค้า" });
    fireEvent.click(increase);
    fireEvent.click(increase);
    fireEvent.click(increase);

    expect(screen.getByLabelText("จำนวน 3")).toBeInTheDocument();
    expect(increase).toBeDisabled();
  });

  it("disables purchase actions when stock is empty", () => {
    vi.spyOn(catalogQueries, "useProductListings").mockReturnValue({
      data: [{ ...listing, quantityAvailable: 0 }],
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as never);

    renderPage();

    const outOfStockButtons = screen.getAllByRole("button", { name: "Out of Stock" });
    expect(outOfStockButtons).toHaveLength(2);
    outOfStockButtons.forEach((button) => expect(button).toBeDisabled());
  });

  it("sends guests to login before Buy Now", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Buy now/ }));
    expect(screen.getByText("Login reached")).toBeInTheDocument();
  });

  it("adds the selected listing and sends logged-in buyers to checkout using the returned cart item id", async () => {
    authSpy.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1 } as never,
      roles: [],
      hasRole: () => false,
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /Buy now/ }));

    expect(await screen.findByText("Checkout reached items=900&productId=1&listingId=55")).toBeInTheDocument();
    expect(addItem).toHaveBeenCalledWith({ listingId: 55, quantity: 1 });
  });
});
