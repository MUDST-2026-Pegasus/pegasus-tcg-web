import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProductsContent } from "@/features/seller/products/components/ProductsContent";
import * as productsApi from "@/features/seller/products/products.api";
import type {
  ListingStatus,
  SellerListingSummary,
} from "@/features/seller/products/products.types";
import * as sellerApi from "@/features/seller/shared/seller.api";
import type { SellerProfile } from "@/features/seller/shared/seller.types";
import { renderWithProviders } from "../utils";

vi.mock("@/features/seller/products/products.api");
vi.mock("@/features/seller/shared/seller.api");

const verifiedSeller: SellerProfile = {
  id: 1,
  userId: 1,
  status: "VERIFIED",
  canPublish: true,
  verifiedAt: "2026-09-01T00:00:00Z",
  suspendedReason: null,
  handlingDays: 2,
  vacationMode: false,
  autoAcceptOrders: false,
  createdAt: "2026-09-01T00:00:00Z",
};

function makeListing(
  id: number,
  productName: string,
  status: ListingStatus,
  quantityAvailable: number,
): SellerListingSummary {
  return {
    id,
    card: {
      variantId: id,
      sku: `LOB-00${id}`,
      variantLabel: "Ultra Rare",
      variantActive: true,
      productId: id,
      productName,
      productSlug: productName.toLowerCase().replaceAll(" ", "-"),
      gameId: 1,
      officialImageUrl: null,
    },
    condition: "NM",
    price: 1500,
    currency: "THB",
    pricingMode: "MANUAL",
    quantityTotal: quantityAvailable,
    quantityReserved: 0,
    quantityAvailable,
    status,
    lotLabel: null,
    primaryPhotoUrl: null,
    updatedAt: "2026-09-01T00:00:00Z",
  };
}

/** ฐานข้อมูลปลอมของ backend — ลบแล้วหายจริง refetch รอบถัดไปจะไม่เห็น */
let listings: SellerListingSummary[];

describe("ProductsContent Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listings = [
      makeListing(1, "Blue Eyes White Dragon", "ACTIVE", 5),
      makeListing(2, "Dark Magician", "DRAFT", 0),
    ];

    vi.mocked(sellerApi.getSellerProfile).mockResolvedValue(verifiedSeller);
    vi.mocked(productsApi.getMyListings).mockImplementation(
      async ({ status, page, size }) => {
        const matched = listings.filter((row) => !status || row.status === status);
        return {
          items: matched.slice(page * size, (page + 1) * size),
          page,
          size,
          totalItems: matched.length,
          totalPages: Math.ceil(matched.length / size),
        };
      },
    );
    vi.mocked(productsApi.deleteListing).mockImplementation(async (id) => {
      listings = listings.filter((row) => row.id !== id);
    });
  });

  it("filters by status through the backend", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductsContent />, { route: "/seller/products" });

    expect(await screen.findByText("Blue Eyes White Dragon")).toBeInTheDocument();
    expect(screen.getByText("Dark Magician")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "พร้อมขาย 1" }));

    await waitFor(() =>
      expect(screen.queryByText("Dark Magician")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Blue Eyes White Dragon")).toBeInTheDocument();
    expect(productsApi.getMyListings).toHaveBeenCalledWith({
      status: "ACTIVE",
      page: 0,
      size: 20,
    });

    await user.click(screen.getByRole("button", { name: "ทั้งหมด 2" }));
    expect(await screen.findByText("Dark Magician")).toBeInTheDocument();
  });

  it("shows the bulk bar while rows are selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductsContent />, { route: "/seller/products" });

    const rowCheckbox = await screen.findByRole("checkbox", {
      name: "เลือกสินค้า: Blue Eyes White Dragon",
    });
    await user.click(rowCheckbox);
    expect(screen.getByText("เลือกแล้ว 1 รายการ")).toBeInTheDocument();

    await user.click(rowCheckbox);
    expect(screen.queryByText("เลือกแล้ว 1 รายการ")).not.toBeInTheDocument();
  });

  it("deletes a listing after confirming", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductsContent />, { route: "/seller/products" });

    await user.click(
      await screen.findByRole("button", { name: "ตัวเลือกเพิ่มเติม: Dark Magician" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "ลบสินค้า" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ลบสินค้านี้ออกจากร้าน?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "ลบถาวร" }));

    expect(productsApi.deleteListing).toHaveBeenCalledWith(2);
    await waitFor(() =>
      expect(screen.queryByText("Dark Magician")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Blue Eyes White Dragon")).toBeInTheDocument();
  });
});
