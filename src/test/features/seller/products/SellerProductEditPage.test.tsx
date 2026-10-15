import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { SellerProductEditPage } from "@/features/seller/products/SellerProductEditPage";
import * as productsApi from "@/features/seller/products/products.api";
import * as listingFormApi from "@/features/seller/products/listing-form.api";
import * as sellerApi from "@/features/seller/shared/seller.api";
import type { SellerListing } from "@/features/seller/products/products.types";
import type { SellerProfile } from "@/features/seller/shared/seller.types";
import { createTestQueryClient } from "@/test/utils";
import { ApiError } from "@/lib/api";

vi.mock("@/features/seller/shared/seller.api", () => ({
  getSellerProfile: vi.fn(),
}));

vi.mock("@/features/seller/products/products.api", () => ({
  getMyListing: vi.fn(),
  getMyListings: vi.fn(),
  changeListingPrice: vi.fn(),
  changeListingStatus: vi.fn(),
  deleteListing: vi.fn(),
}));

vi.mock("@/features/seller/products/listing-form.api", () => ({
  getMarketListings: vi.fn(),
  updateListingDetails: vi.fn(),
  MARKET_SAMPLE_SIZE: 100,
}));

const mockProfile: SellerProfile = {
  id: 10,
  userId: 10,
  status: "VERIFIED",
  canPublish: true,
  vacationMode: false,
  handlingDays: 2,
  autoAcceptOrders: true,
  verifiedAt: "2026-01-01T00:00:00Z",
  suspendedReason: null,
  createdAt: "2026-01-01T00:00:00Z",
};

const mockListing: SellerListing = {
  id: 101,
  card: {
    variantId: 1,
    sku: "PKM-001",
    variantLabel: "en / HOLO / UNLIMITED",
    variantActive: true,
    productId: 50,
    productName: "Charizard Base Set Holo",
    productSlug: "charizard-base-set-holo",
    gameId: 1,
    officialImageUrl: null,
  },
  condition: "NM",
  price: 15000,
  currency: "THB",
  pricingMode: "MANUAL",
  quantityTotal: 2,
  quantityReserved: 0,
  quantityAvailable: 2,
  status: "ACTIVE",
  lotLabel: null,
  updatedAt: "2026-01-01T00:00:00Z",
  gradingCompany: null,
  gradeValue: null,
  autoPriceOffsetPercent: null,
  autoPriceFloor: null,
  autoPriceCeiling: null,
  lastAutoPricedAt: null,
  publicNote: "Near mint condition foil",
  version: 1,
  publishedAt: "2026-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  photos: [],
  similarListings: [],
  costBasis: {
    quantity: 2,
    totalCost: 20000,
    averageUnitCost: 10000,
  },
};

describe("SellerProductEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sellerApi.getSellerProfile).mockResolvedValue(mockProfile);
    vi.mocked(listingFormApi.getMarketListings).mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 0,
      size: 100,
    });
  });

  function renderPage(productId = "101") {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/seller/products/${productId}/edit`]}>
          <Routes>
            <Route path="/seller/products/:productId/edit" element={<SellerProductEditPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("renders product not found for invalid product id", async () => {
    renderPage("invalid-id");

    expect(await screen.findByText("ไม่พบสินค้านี้")).toBeInTheDocument();
  });

  it("renders product not found when API returns LISTING_NOT_FOUND", async () => {
    vi.mocked(productsApi.getMyListing).mockRejectedValue(
      new ApiError({ status: 404, code: "LISTING_NOT_FOUND", message: "Not found" }),
    );

    renderPage("999");

    expect(await screen.findByText("ไม่พบสินค้านี้")).toBeInTheDocument();
  });

  it("renders edit page and enables save when price is modified", async () => {
    vi.mocked(productsApi.getMyListing).mockResolvedValue(mockListing);
    vi.mocked(productsApi.changeListingPrice).mockResolvedValue({
      ...mockListing,
      price: 16000,
    });

    const user = userEvent.setup();
    renderPage("101");

    expect(await screen.findByRole("heading", { name: /แก้ไขสินค้า/ })).toBeInTheDocument();
    expect(screen.getAllByText("Charizard Base Set Holo").length).toBeGreaterThan(0);

    const saveBtn = screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" });
    expect(saveBtn).toBeDisabled();

    // Change price
    const priceInput = screen.getByLabelText(/ราคาขายต่อใบ/);
    await user.clear(priceInput);
    await user.type(priceInput, "16000");

    // Save button should now be enabled
    await waitFor(() => {
      expect(saveBtn).toBeEnabled();
    });
  });
});
