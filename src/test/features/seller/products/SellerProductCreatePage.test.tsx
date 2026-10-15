import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { SellerProductCreatePage } from "@/features/seller/products/SellerProductCreatePage";
import * as listingFormApi from "@/features/seller/products/listing-form.api";
import * as sellerApi from "@/features/seller/shared/seller.api";
import { createTestQueryClient } from "@/test/utils";
import type { SellerProfile } from "@/features/seller/shared/seller.types";

vi.mock("@/features/seller/shared/seller.api", () => ({
  getSellerProfile: vi.fn(),
}));

vi.mock("@/features/seller/products/listing-form.api", () => ({
  searchCatalog: vi.fn(),
  getCatalogProduct: vi.fn(),
  findVariantByCode: vi.fn(),
  getMarketListings: vi.fn(),
  createListing: vi.fn(),
  addListingUnits: vi.fn(),
  updateListingDetails: vi.fn(),
  getStockIns: vi.fn(),
  MARKET_SAMPLE_SIZE: 100,
}));

vi.mock("@/features/seller/products/products.api", () => ({
  getMyListing: vi.fn(),
  getMyListings: vi.fn(),
  changeListingPrice: vi.fn(),
  changeListingStatus: vi.fn(),
  deleteListing: vi.fn(),
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

const mockVariantLookup = {
  productId: 50,
  productName: "Charizard Base Set Holo",
  productSlug: "charizard-base-set-holo",
  variantLabel: "en / HOLO / UNLIMITED",
  variant: {
    id: 1,
    catalogProductId: 50,
    sku: "PKM-001",
    languageCode: "en",
    finish: "HOLO" as const,
    edition: "UNLIMITED" as const,
    printingNote: null,
    barcode: "123456789012",
    imageUrl: null,
    active: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
};

const mockProductDetail = {
  product: {
    id: 50,
    gameId: 1,
    cardSetId: 1,
    productType: "SINGLE_CARD" as const,
    name: "Charizard Base Set Holo",
    nameLocal: "ลิซาร์ดอน",
    slug: "charizard-base-set-holo",
    cardNumber: "004/102",
    rarityCode: "HR",
  },
  variants: [mockVariantLookup.variant],
  images: [],
};

const mockMarketResponse = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: 100,
};

describe("SellerProductCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sellerApi.getSellerProfile).mockResolvedValue(mockProfile);
    vi.mocked(listingFormApi.findVariantByCode).mockResolvedValue(mockVariantLookup);
    vi.mocked(listingFormApi.getCatalogProduct).mockResolvedValue(mockProductDetail);
    vi.mocked(listingFormApi.getMarketListings).mockResolvedValue(mockMarketResponse);
  });

  function renderPage() {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/seller/products/new"]}>
          <SellerProductCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("renders page header and card picker step", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "ลงขายสินค้าใหม่" })).toBeInTheDocument();
    expect(screen.getByText("เลือกการ์ดจากแคตตาล็อก")).toBeInTheDocument();
    expect(screen.getByLabelText("SKU หรือบาร์โค้ด")).toBeInTheDocument();
  });

  it("selects a card via SKU code lookup and moves to step 2", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("heading", { name: "ลงขายสินค้าใหม่" });

    const codeInput = screen.getByLabelText("SKU หรือบาร์โค้ด");
    await user.type(codeInput, "PKM-001");

    const lookupBtn = screen.getByRole("button", { name: "ค้นด้วยรหัส" });
    await user.click(lookupBtn);

    const useCardBtn = await screen.findByRole("button", { name: "ใช้การ์ดนี้" });
    await user.click(useCardBtn);

    // Expect to transition to Step 2
    expect(await screen.findByText("สภาพการ์ด")).toBeInTheDocument();
    expect(screen.getByText("ราคาและจำนวน")).toBeInTheDocument();
  });
});
