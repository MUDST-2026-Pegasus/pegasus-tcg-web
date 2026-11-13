import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { ProductTable } from "@/features/seller/products/components/ProductTable";
import type { SellerListingSummary } from "@/features/seller/products/products.types";
import { renderWithProviders } from "@/test/utils";

function listing(id: number, quantityAvailable: number): SellerListingSummary {
  return {
    id,
    card: {
      variantId: id,
      sku: `TCG-${id}`,
      variantLabel: "EN / HOLO / UNLIMITED",
      variantActive: true,
      productId: id,
      productName: `Card ${id}`,
      productSlug: `card-${id}`,
      gameId: 1,
      officialImageUrl: null,
    },
    condition: "NM",
    price: 250,
    currency: "THB",
    pricingMode: "AUTO_MEDIAN",
    quantityTotal: quantityAvailable,
    quantityReserved: 0,
    quantityAvailable,
    status: quantityAvailable === 0 ? "SOLD_OUT" : "ACTIVE",
    lotLabel: null,
    primaryPhotoUrl: null,
    updatedAt: "2026-11-01T00:00:00Z",
  };
}

describe("ProductTable stock display", () => {
  it("marks low active stock and sold-out rows distinctly, without warning on healthy stock", () => {
    renderWithProviders(
      <ProductTable
        rows={[listing(1, 0), listing(2, 1), listing(3, 2), listing(4, 3)]}
        selectedIds={[]}
        onToggleRow={vi.fn()}
        onToggleAll={vi.fn()}
        onDeleteRow={vi.fn()}
        readOnly
        isFetching={false}
        footer={<div>Pagination</div>}
      />,
    );

    const soldOutRow = screen.getByRole("row", { name: /Card 1/ });
    const oneLeftRow = screen.getByRole("row", { name: /Card 2/ });
    const twoLeftRow = screen.getByRole("row", { name: /Card 3/ });
    const healthyRow = screen.getByRole("row", { name: /Card 4/ });

    expect(within(soldOutRow).getAllByText("0").some((node) => node.classList.contains("text-[#d0342c]"))).toBe(true);
    expect(within(oneLeftRow).getByText("1")).toHaveClass("text-[#b45309]");
    expect(within(oneLeftRow).getByText("ใกล้หมด")).toBeInTheDocument();
    expect(within(twoLeftRow).getByText("2")).toHaveClass("text-[#b45309]");
    expect(within(twoLeftRow).getByText("ใกล้หมด")).toBeInTheDocument();
    expect(within(healthyRow).getByText("3")).toHaveClass("text-foreground");
    expect(within(healthyRow).queryByText("ใกล้หมด")).not.toBeInTheDocument();
  });
});
