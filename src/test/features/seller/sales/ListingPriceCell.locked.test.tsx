import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ListingPriceCell } from "@/features/seller/products/components/ListingPriceCell";
import * as productsApi from "@/features/seller/products/products.api";
import type { SellerListingSummary } from "@/features/seller/products/products.types";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/seller/products/products.api", () => ({
  getMyListing: vi.fn(),
  getMyListings: vi.fn(),
  changeListingPrice: vi.fn(),
  changeListingStatus: vi.fn(),
  deleteListing: vi.fn(),
}));

const listing: SellerListingSummary = {
  id: 7,
  card: {
    variantId: 1,
    sku: "SV3A-1",
    variantLabel: "EN",
    variantActive: true,
    productId: 2,
    productName: "Charizard ex SAR",
    productSlug: "charizard-ex-sar",
    gameId: 1,
    officialImageUrl: null,
  },
  condition: "NM",
  price: 4200,
  currency: "THB",
  pricingMode: "MANUAL",
  quantityTotal: 3,
  quantityReserved: 0,
  quantityAvailable: 3,
  status: "ACTIVE",
  lotLabel: null,
  primaryPhotoUrl: null,
  updatedAt: "2026-11-01T00:00:00Z",
};

describe("ListingPriceCell — SALE_PRICE_LOCKED", () => {
  beforeEach(() => vi.clearAllMocks());

  it("raising a locked price shows the modal, not a generic toast", async () => {
    const toastSpy = vi.spyOn(toast, "add");
    vi.mocked(productsApi.changeListingPrice).mockRejectedValue(
      new ApiError({
        status: 409,
        code: "SALE_PRICE_LOCKED",
        message: "locked",
        details: { saleName: "Pokémon Month", ownerType: "PLATFORM", endsAt: "2026-11-30T10:00:00Z", currentPrice: 4200 },
      }),
    );
    renderWithProviders(<ListingPriceCell listing={listing} readOnly={false} />);

    await userEvent.click(screen.getByRole("button", { name: "แก้ราคา: Charizard ex SAR" }));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "4900");
    await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));

    expect(await screen.findByText("ขึ้นราคาไม่ได้ระหว่างการลดราคา")).toBeInTheDocument();
    expect(screen.getByText(/อยู่ใน “Pokémon Month” \(Pegasus\)/)).toBeInTheDocument();
    expect(screen.getByText("THB 4,900.00")).toBeInTheDocument();
    await waitFor(() => expect(toastSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error" })));
  });
});
