import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/utils";

import { PriceTag, type ListingPricing } from "@/components/sale";

const sale = (type: "FLASH_SALE" | "CATEGORY_SALE"): ListingPricing["sale"] => ({
  id: 1,
  slug: "pokemon-month",
  name: "Pokémon Month",
  type,
  endsAt: "2026-11-30T16:59:00Z",
  quotaLeft: 8,
  perBuyerLimit: 1,
});

describe("PriceTag", () => {
  it("Default: one price in the primary colour, nothing struck", () => {
    const { container } = renderWithProviders(<PriceTag pricing={{ listPrice: 4200, salePrice: 4200, discountPercent: null, sale: null }} />);
    expect(container.querySelector("[data-slot=price-tag]")).toHaveAttribute("data-state", "default");
    expect(screen.getByText("฿4,200")).toHaveClass("text-primary");
    expect(container.querySelector("s")).toBeNull();
    expect(screen.queryByText(/^-\d+%$/)).toBeNull();
  });

  it("Sale: red sale price, -N% badge from the API, list price struck", () => {
    const { container } = renderWithProviders(
      <PriceTag pricing={{ listPrice: 4200, salePrice: 3360, discountPercent: 20, sale: sale("CATEGORY_SALE") }} />,
    );
    expect(container.querySelector("[data-slot=price-tag]")).toHaveAttribute("data-state", "sale");
    expect(screen.getByText("฿3,360")).toHaveClass("text-[#dc2626]");
    expect(screen.getByText("-20%")).toBeInTheDocument();
    expect(container.querySelector("s")).toHaveTextContent("฿4,200");
  });

  it("Flash: same tag with flash state", () => {
    const { container } = renderWithProviders(
      <PriceTag pricing={{ listPrice: 4200, salePrice: 2990, discountPercent: 29, sale: sale("FLASH_SALE") }} />,
    );
    expect(container.querySelector("[data-slot=price-tag]")).toHaveAttribute("data-state", "flash");
    expect(screen.getByText("-29%")).toBeInTheDocument();
  });

  it("uses the API's numbers as-is (no recomputing on the client)", () => {
    // discountPercent from the API is shown even if it does not match a client-side calculation
    renderWithProviders(<PriceTag pricing={{ listPrice: 1000, salePrice: 700, discountPercent: 31, sale: sale("CATEGORY_SALE") }} />);
    expect(screen.getByText("-31%")).toBeInTheDocument();
  });

  it("falls back to the plain price without pricing (older API)", () => {
    renderWithProviders(<PriceTag price={1990} />);
    expect(screen.getByText("฿1,990")).toBeInTheDocument();
  });

  it("treats a sale without a lower price as default", () => {
    const { container } = renderWithProviders(<PriceTag pricing={{ listPrice: 500, salePrice: 500, discountPercent: 0, sale: sale("CATEGORY_SALE") }} />);
    expect(container.querySelector("[data-slot=price-tag]")).toHaveAttribute("data-state", "default");
  });
});
