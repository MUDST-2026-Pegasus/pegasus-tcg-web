import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
          <Route path="/u/:username" element={<CollectionTarget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function CheckoutTarget() {
  const [params] = useSearchParams();
  return <p>Checkout reached {params.toString()}</p>;
}

function CollectionTarget() {
  const [params] = useSearchParams();
  return <p>Collection reached {params.toString()}</p>;
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
    vi.spyOn(catalogQueries, "useProductMarket").mockReturnValue({ data: [] } as never);
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

  it("opens a collector's public collection from View profile", () => {
    vi.spyOn(catalogQueries, "useProductCollectors").mockReturnValue({
      data: { items: [{ username: "ice5", displayName: "Ice", avatarUrl: null, quantity: 1 }], totalItems: 1, totalPages: 1 },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    renderPage();

    const profileLink = screen.getByRole("link", { name: "View profile" });
    expect(profileLink).toHaveAttribute("href", "/u/ice5?tab=collection");
    fireEvent.click(profileLink);
    expect(screen.getByText("Collection reached tab=collection")).toBeInTheDocument();
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

  it("filters market listings by the variant picked from the dropdown", async () => {
    const variant = { catalogProductId: 1, imageUrl: null, active: true, edition: "NOT_APPLICABLE", printingNote: null };
    vi.spyOn(catalogQueries, "useProductDetail").mockReturnValue({
      data: {
        ...product,
        variants: [
          { ...variant, id: 10, sku: "PIK-025-EN", languageCode: "EN", finish: "HOLO" },
          { ...variant, id: 11, sku: "PIK-025-JA", languageCode: "JA", finish: "NOT_APPLICABLE" },
        ],
      },
      isPending: false,
      isError: false,
    } as never);
    vi.spyOn(catalogQueries, "useProductListings").mockReturnValue({
      data: [
        listing,
        { ...listing, id: 56, card: { ...listing.card, variantId: 11 }, seller: { username: "tokyo", displayName: "Tokyo Shop", avatarUrl: null } },
      ],
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as never);
    vi.spyOn(catalogQueries, "useProductMarket").mockReturnValue({ data: [
      { catalogVariantId: 10, condition: "NM", medianPrice: 3000, statDate: "2026-10-15", change30dPercent: null, lastSold: null, lowSample: false },
      { catalogVariantId: 11, condition: "NM", medianPrice: 2500, statDate: "2026-10-15", change30dPercent: null, lastSold: null, lowSample: false },
    ] } as never);
    const user = userEvent.setup();
    renderPage();

    const dropdown = screen.getByRole("combobox", { name: "Select variant" });
    expect(dropdown).toHaveTextContent("All variants");
    expect(screen.getByText("฿3,000.00")).toBeInTheDocument();
    expect(screen.getByLabelText("ดูรายละเอียดสินค้าของ Seller")).toBeInTheDocument();

    await user.click(dropdown);
    await user.click(await screen.findByRole("option", { name: "JA" }));

    expect(dropdown).toHaveTextContent("JA");
    expect(screen.getByText("฿2,500.00")).toBeInTheDocument();
    expect(screen.getByLabelText("ดูรายละเอียดสินค้าของ Tokyo Shop")).toBeInTheDocument();
    expect(screen.queryByLabelText("ดูรายละเอียดสินค้าของ Seller")).not.toBeInTheDocument();
  });

  it("shows market data for the cheapest matching variant and condition", async () => {
    vi.spyOn(catalogQueries, "useProductMarket").mockReturnValue({ data: [
      { catalogVariantId: 10, condition: "NM", medianPrice: 3000, statDate: "2026-10-15", change30dPercent: 4.8, lastSold: { price: 2900, soldAt: "2026-10-14T12:00:00" }, lowSample: true },
      { catalogVariantId: 10, condition: "LP", medianPrice: 2000, statDate: "2026-10-15", change30dPercent: -5, lastSold: null, lowSample: false },
    ] } as never);
    vi.spyOn(catalogQueries, "useProductListings").mockReturnValue({ data: [listing, { ...listing, id: 56, condition: "LP", price: 90 }], isPending: false, isError: false, isSuccess: true } as never);
    renderPage();

    expect(screen.getByText("฿3,000.00")).toBeInTheDocument();
    expect(screen.getByText("↑ 4.8%")).toBeInTheDocument();
    expect(screen.getByText("฿2,900.00")).toBeInTheDocument();
    expect(screen.getByText(/ข้อมูลราคายังน้อย/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Lightly Played")[0].closest("button")!);
    expect(screen.getByText("฿2,000.00")).toBeInTheDocument();
    expect(screen.getByText("↓ 5%")).toBeInTheDocument();
    expect(screen.getByText("Last sold").parentElement).toHaveTextContent("—");
  });

  it("shows dashes when market data is missing", () => {
    renderPage();
    expect(screen.getByText("Market price").parentElement).toHaveTextContent("—");
    expect(screen.getByText("Last sold").parentElement).toHaveTextContent("—");
  });

  it("keeps the product visible when the market API fails", () => {
    vi.spyOn(catalogQueries, "useProductMarket").mockReturnValue({ data: undefined, isError: true } as never);
    renderPage();
    expect(screen.getByText("Pikachu ex", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByText("Market price").parentElement).toHaveTextContent("—");
  });
});
