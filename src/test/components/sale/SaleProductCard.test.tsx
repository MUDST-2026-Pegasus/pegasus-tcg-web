import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { SaleProductCard, type ListingPricing } from "@/components/sale";
import { renderWithProviders } from "@/test/utils";

const flash = (quotaLeft: number): ListingPricing => ({
  listPrice: 4780,
  salePrice: 3346,
  discountPercent: 30,
  sale: { id: 1, slug: "1111-flash", name: "11.11 Flash Sale", type: "FLASH_SALE", endsAt: "2026-11-11T16:59:00Z", quotaLeft, perBuyerLimit: 1 },
});

describe("SaleProductCard", () => {
  it("Flash: badge, flash price and quota bar", () => {
    renderWithProviders(<SaleProductCard title="Charizard ex SAR" href="/listings/1" pricing={flash(8)} quota={25} />);
    expect(screen.getByText("⚡ FLASH SALE")).toBeInTheDocument();
    expect(screen.getByText("฿3,346")).toBeInTheDocument();
    expect(screen.getByText("ขายแล้ว 17/25 · เหลือ 8 ชิ้น")).toBeInTheDocument();
  });

  it("quota sold out: faded, 'หมดแล้ว', regular price, still links to the listing", () => {
    renderWithProviders(<SaleProductCard title="Darkrai ex" href="/listings/9" pricing={flash(0)} quota={20} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/listings/9");
    expect(link).toHaveAttribute("data-state", "sold-out");
    expect(link.firstElementChild).toHaveClass("opacity-55");
    expect(screen.getByText("หมดแล้ว")).toBeInTheDocument();
    expect(screen.getByText("ราคา Flash หมดแล้ว")).toBeInTheDocument();
    // ราคาปกติ ไม่มีราคาขีดฆ่า
    expect(screen.getByText("฿4,780")).toBeInTheDocument();
    expect(screen.queryByText("฿3,346")).toBeNull();
  });

  it("upcoming flash: regular price with 'เร็วๆ นี้'", () => {
    renderWithProviders(<SaleProductCard title="Mew VMAX" href="/listings/3" pricing={flash(20)} quota={20} upcoming />);
    expect(screen.getByText("⚡ เร็วๆ นี้")).toBeInTheDocument();
    expect(screen.getByText("฿4,780")).toBeInTheDocument();
  });

  it("Sale: -N% badge on the image", () => {
    renderWithProviders(
      <SaleProductCard
        title="Pikachu AR"
        href="/listings/2"
        pricing={{ listPrice: 2790, salePrice: 2511, discountPercent: 10, sale: { ...flash(1).sale!, type: "CATEGORY_SALE", quotaLeft: null } }}
      />,
    );
    expect(screen.getAllByText("-10%")).toHaveLength(2);
    expect(screen.getByRole("link")).toHaveAttribute("data-state", "sale");
  });
});
