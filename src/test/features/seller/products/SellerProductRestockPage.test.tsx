import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { SellerProductRestockPage } from "@/features/seller/products/SellerProductRestockPage";
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
  getStockIns: vi.fn(),
  addListingUnits: vi.fn(),
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
  publicNote: null,
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

const mockStockInHistory = {
  receivedTotal: 2,
  soldTotal: 0,
  lots: {
    items: [],
    totalItems: 0,
    totalPages: 0,
    page: 0,
    size: 20,
  },
};

describe("SellerProductRestockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sellerApi.getSellerProfile).mockResolvedValue(mockProfile);
    vi.mocked(listingFormApi.getStockIns).mockResolvedValue(mockStockInHistory);
  });

  function renderPage(productId = "101") {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/seller/products/${productId}/restock`]}>
          <Routes>
            <Route path="/seller/products/:productId/restock" element={<SellerProductRestockPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("renders product not found for invalid product id", async () => {
    renderPage("not-a-number");

    expect(await screen.findByText("ไม่พบสินค้านี้")).toBeInTheDocument();
  });

  it("renders product not found when API returns LISTING_NOT_FOUND", async () => {
    vi.mocked(productsApi.getMyListing).mockRejectedValue(
      new ApiError({ status: 404, code: "LISTING_NOT_FOUND", message: "Not found" }),
    );

    renderPage("999");

    expect(await screen.findByText("ไม่พบสินค้านี้")).toBeInTheDocument();
  });

  it("renders restock form and enables save when quantity and cost are entered", async () => {
    vi.mocked(productsApi.getMyListing).mockResolvedValue(mockListing);
    vi.mocked(listingFormApi.addListingUnits).mockResolvedValue([]);

    const user = userEvent.setup();
    renderPage("101");

    expect(await screen.findByRole("heading", { name: "เติมสต็อก" })).toBeInTheDocument();
    expect(screen.getAllByText("Charizard Base Set Holo").length).toBeGreaterThan(0);
    expect(screen.getByText("รับสินค้าเข้าล็อตใหม่")).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: "บันทึกการรับเข้า" });
    expect(saveBtn).toBeDisabled();

    // Enter quantity and total cost
    const qtyInput = screen.getByLabelText(/จำนวนที่รับเข้า/);
    const costInput = screen.getByLabelText(/ต้นทุนรวมทั้งล็อต/);

    await user.type(qtyInput, "5");
    await user.type(costInput, "50000");

    await waitFor(() => {
      expect(saveBtn).toBeEnabled();
    });
  });
});
