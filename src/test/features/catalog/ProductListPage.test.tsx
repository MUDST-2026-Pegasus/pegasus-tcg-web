import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import * as catalogApi from "@/features/catalog/catalog.api";
import { ProductListPage } from "@/features/catalog/pages/ProductListPage";
import type { PageResponse } from "@/lib/api";
import type { ProductSummaryDto } from "@/features/catalog/catalog.types";
import { createTestQueryClient, render } from "@/test/utils";

const mockProducts: PageResponse<ProductSummaryDto> = {
  items: [
    {
      id: 1,
      slug: "pikachu-ex-025-187",
      name: "Pikachu ex",
      nameLocal: "พิคาชู ex",
      gameId: 1,
      categoryId: 1,
      cardSetId: 10,
      productType: "SINGLE_CARD",
      cardNumber: "025/187",
      rarityCode: "RR",
      primaryImageUrl: "https://example.com/pikachu.jpg",
      variantCount: 1,
      lowestPrice: 250,
      listingCount: 3,
    },
    {
      id: 2,
      slug: "charizard-ex-006-165",
      name: "Charizard ex",
      nameLocal: "ลิซาร์ดอน ex",
      gameId: 1,
      categoryId: 1,
      cardSetId: 10,
      productType: "SINGLE_CARD",
      cardNumber: "006/165",
      rarityCode: "SAR",
      primaryImageUrl: null,
      variantCount: 1,
      lowestPrice: 1200,
      listingCount: 5,
    },
  ],
  page: 0,
  size: 20,
  totalItems: 40,
  totalPages: 2,
};

describe("ProductListPage Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(catalogApi, "getGames").mockResolvedValue([
      {
        id: 1,
        code: "POKEMON",
        name: "Pokémon",
        nameLocal: "โปเกมอน",
        slug: "pokemon",
        logoUrl: null,
        displayOrder: 1,
      },
    ]);
  });

  const renderComponent = (props: { gameCode?: string; title?: string } = {}) => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProductListPage {...props} />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("renders product cards with names, card numbers, and formatted prices", async () => {
    vi.spyOn(catalogApi, "getProducts").mockResolvedValue(mockProducts);

    renderComponent();

    // Verify title
    expect(await screen.findByRole("heading", { level: 1, name: "สินค้าทั้งหมด" })).toBeInTheDocument();

    // Verify products rendered
    expect(await screen.findByText("Pikachu ex")).toBeInTheDocument();
    expect(screen.getByText("Charizard ex")).toBeInTheDocument();
    expect(screen.getByText("025/187")).toBeInTheDocument();
    expect(screen.getByText("006/165")).toBeInTheDocument();

    // Check placeholder for card without image
    expect(screen.getByText("ยังไม่มีรูปสินค้า")).toBeInTheDocument();

    // Check links
    const pikachuLink = screen.getByRole("link", { name: /Pikachu ex/i });
    expect(pikachuLink).toHaveAttribute("href", "/products/pikachu-ex-025-187");
  });

  it("renders empty state when no products are found in the catalog", async () => {
    vi.spyOn(catalogApi, "getProducts").mockResolvedValue({
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
    });

    renderComponent();

    expect(await screen.findByText("ยังไม่มีสินค้า")).toBeInTheDocument();
    expect(screen.getByText("กลับมาดูสินค้าใหม่ภายหลัง")).toBeInTheDocument();
  });

  it("renders pagination controls and updates page when clicking next", async () => {
    const user = userEvent.setup();
    const getProductsSpy = vi.spyOn(catalogApi, "getProducts").mockResolvedValue(mockProducts);

    renderComponent();

    expect(await screen.findByText("Pikachu ex")).toBeInTheDocument();

    // Pagination info
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    const prevButton = screen.getByRole("button", { name: "ก่อนหน้า" });
    const nextButton = screen.getByRole("button", { name: "ถัดไป" });

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Click next page
    await user.click(nextButton);

    expect(getProductsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, size: 20 })
    );
  });
});
