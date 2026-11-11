import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";

import { SellerProductRestockPage } from "@/features/seller/products/SellerProductRestockPage";
import * as productsApi from "@/features/seller/products/products.api";
import * as listingFormApi from "@/features/seller/products/listing-form.api";
import * as sellerApi from "@/features/seller/shared/seller.api";
import type { SellerListing } from "@/features/seller/products/products.types";
import type { SellerProfile } from "@/features/seller/shared/seller.types";
import { renderWithProviders, screen, waitFor } from "@/test/utils";
import { ApiError } from "@/lib/api";
import { toast } from "@/components/ui/toast";

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

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    api: {
      ...actual.api,
      get: vi.fn().mockResolvedValue({
        listingId: 101,
        listingName: "Charizard Base Set Holo",
        status: "FORECAST_AVAILABLE",
        periodStart: "2026-10-15",
        periodEnd: "2026-11-13",
        availableStock: 2,
        completedSales30Days: 6,
        daysRemaining: 10,
        estimatedStockoutDate: "2026-11-23",
        updatedAt: "2026-11-13T00:00:00Z",
      }),
    },
  };
});

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
  blockReason: null,
  blockedAt: null,
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
    return renderWithProviders(
      <Routes>
        <Route path="/seller/products/:productId/restock" element={<SellerProductRestockPage />} />
        <Route path="/seller/products" element={<h1>Product management</h1>} />
      </Routes>,
      { route: `/seller/products/${productId}/restock` },
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

  it.each([
    [401, "UNAUTHENTICATED"],
    [403, "FORBIDDEN"],
  ])("keeps the restock form inaccessible when listing access returns %i", async (status, code) => {
    vi.mocked(productsApi.getMyListing).mockRejectedValue(new ApiError({ status, code, message: "Access denied" }));
    renderPage("101");

    expect(await screen.findByText("โหลดข้อมูลไม่สำเร็จ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ลองใหม่" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "เติมสต็อก" })).not.toBeInTheDocument();
  });

  it("submits a restock lot successfully and returns to product management", async () => {
    vi.mocked(productsApi.getMyListing).mockResolvedValue(mockListing);
    vi.mocked(listingFormApi.addListingUnits).mockResolvedValue([]);
    const user = userEvent.setup();
    renderPage("101");

    await screen.findByRole("heading", { name: "เติมสต็อก" });
    await user.type(screen.getByLabelText(/จำนวนที่รับเข้า/), "4");
    await user.type(screen.getByLabelText(/ต้นทุนรวมทั้งล็อต/), "40000");
    await user.click(screen.getByRole("button", { name: "บันทึกการรับเข้า" }));

    expect(await screen.findByRole("heading", { name: "Product management" })).toBeInTheDocument();
    expect(listingFormApi.addListingUnits).toHaveBeenCalledTimes(1);
    expect(listingFormApi.addListingUnits).toHaveBeenCalledWith(101, expect.objectContaining({ quantity: 4, unitCost: 10000 }));
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

  it("blocks duplicate restock submissions while saving and reports an API stock validation error", async () => {
    let rejectSave!: (reason: unknown) => void;
    const toastSpy = vi.spyOn(toast, "add");
    vi.mocked(productsApi.getMyListing).mockResolvedValue(mockListing);
    vi.mocked(listingFormApi.addListingUnits).mockImplementation(() => new Promise((_, reject) => { rejectSave = reject; }));

    const user = userEvent.setup();
    renderPage("101");
    await screen.findByRole("heading", { name: "เติมสต็อก" });

    await user.type(screen.getByLabelText(/จำนวนที่รับเข้า/), "4");
    await user.type(screen.getByLabelText(/ต้นทุนรวมทั้งล็อต/), "40000");
    const saveButton = screen.getByRole("button", { name: "บันทึกการรับเข้า" });
    await user.click(saveButton);
    expect(screen.getByRole("button", { name: "บันทึกการรับเข้า" })).toBeDisabled();
    await user.click(saveButton);
    expect(listingFormApi.addListingUnits).toHaveBeenCalledTimes(1);

    rejectSave(new ApiError({ status: 422, code: "VALIDATION_ERROR", message: "Stock entry is invalid" }));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ title: "Stock entry is invalid", type: "error" })));
    expect(screen.getByRole("button", { name: "บันทึกการรับเข้า" })).toBeEnabled();
    expect(listingFormApi.addListingUnits).toHaveBeenCalledTimes(1);
  });

  it.each([
    [401, "UNAUTHENTICATED"],
    [403, "FORBIDDEN"],
    [500, "INTERNAL_ERROR"],
  ])("reports a failed restock request (%i) and allows the seller to retry", async (status, code) => {
    const toastSpy = vi.spyOn(toast, "add");
    vi.mocked(productsApi.getMyListing).mockResolvedValue(mockListing);
    vi.mocked(listingFormApi.addListingUnits).mockRejectedValue(
      new ApiError({ status, code, message: "Restock request failed" }),
    );

    const user = userEvent.setup();
    renderPage("101");
    await screen.findByRole("heading", { level: 1 });
    const fields = screen.getAllByRole("textbox");
    await user.type(fields[0], "3");
    await user.type(fields[1], "30000");
    const saveButton = screen.getAllByRole("button").find((button) => button.tagName === "BUTTON");
    expect(saveButton).toBeDefined();
    await user.click(saveButton!);

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", title: "Restock request failed" }),
    ));
    expect(saveButton).toBeEnabled();
    expect(listingFormApi.addListingUnits).toHaveBeenCalledTimes(1);
  });
});
