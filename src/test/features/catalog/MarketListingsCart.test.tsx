import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { toast } from "@/components/ui/toast";
import { cartApi } from "@/features/cart/cart.api";
import * as catalogQueries from "@/features/catalog/catalog.queries";
import { MarketListingsPage } from "@/features/catalog/pages/MarketListingsPage";
import { ApiError } from "@/lib/api";
import { createTestQueryClient } from "@/test/utils";

const product = {
  product: {
    id: 1,
    gameId: 1,
    categoryId: 1,
    cardSetId: null,
    productType: "BOOSTER_BOX" as const,
    name: "Mega Evolution Booster Box [ENG]",
    nameLocal: null,
    slug: "mega-evolution-booster-box-en",
    cardNumber: null,
    rarityCode: null,
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
    sku: "MEG-BOX-EN",
    variantLabel: "EN",
    productId: 1,
    productName: "Mega Evolution Booster Box [ENG]",
    productSlug: "mega-evolution-booster-box-en",
    gameId: 1,
    officialImageUrl: null,
  },
  condition: "SEALED" as const,
  price: 5590,
  currency: "THB",
  quantityAvailable: 2,
  primaryPhotoUrl: null,
  seller: { username: "pegasus_official", displayName: "Pegasus Official", avatarUrl: null },
};

function mockListings(rows: typeof listing[]) {
  vi.spyOn(catalogQueries, "useProductListings").mockReturnValue({
    data: rows,
    isPending: false,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
  } as never);
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={["/products/mega-evolution-booster-box-en/listings"]}>
        <Routes>
          <Route path="/products/:productId/listings" element={<MarketListingsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const addButton = () => screen.getByRole("button", { name: "เพิ่มสินค้าของ Pegasus Official ลงรถเข็น" });

describe("MarketListingsPage Add button", () => {
  const addItem = vi.spyOn(cartApi, "addItem");
  const toastAdd = vi.spyOn(toast, "add");

  beforeEach(() => {
    vi.clearAllMocks();
    toastAdd.mockImplementation(vi.fn());
    vi.spyOn(catalogQueries, "useProductDetail").mockReturnValue({
      data: product,
      isPending: false,
      isError: false,
    } as never);
    vi.spyOn(catalogQueries, "useGameList").mockReturnValue({ data: [] } as never);
    mockListings([listing]);
    vi.spyOn(catalogQueries, "useProductMarket").mockReturnValue({ data: [] } as never);
    addItem.mockResolvedValue({ id: 900 } as never);
  });

  it("adds one of the chosen listing to the cart", async () => {
    renderPage();

    fireEvent.click(addButton());

    await waitFor(() => expect(addItem).toHaveBeenCalledWith({ listingId: 55, quantity: 1 }));
    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ title: "เพิ่มลงรถเข็นแล้ว", type: "success" })),
    );
  });

  it("explains why the cart refused the listing", async () => {
    addItem.mockRejectedValue(
      new ApiError({ status: 409, code: "CANNOT_BUY_OWN_LISTING", message: "Cannot buy own listing" }),
    );
    renderPage();

    fireEvent.click(addButton());

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "เพิ่มลงรถเข็นไม่สำเร็จ",
          description: "ไม่สามารถซื้อสินค้าที่คุณเป็นผู้ขายเองได้",
          type: "error",
        }),
      ),
    );
  });

  it("does not offer a listing with no stock left", () => {
    mockListings([{ ...listing, quantityAvailable: 0 }]);
    renderPage();

    expect(addButton()).toBeDisabled();
  });

  it("shows market price for the cheapest listing", () => {
    vi.spyOn(catalogQueries, "useProductMarket").mockReturnValue({ data: [
      { catalogVariantId: 10, condition: "SEALED", medianPrice: 3000, statDate: "2026-10-15", change30dPercent: 1, lastSold: null, lowSample: false },
    ] } as never);
    renderPage();
    expect(screen.getByText("฿3,000")).toBeInTheDocument();
  });
});
