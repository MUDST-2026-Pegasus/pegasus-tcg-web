import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchResultsPage } from "@/features/catalog/pages/SearchResultsPage";
import * as catalogApi from "@/features/catalog/catalog.api";
import type {
  GameDto,
  CategoryDto,
  ProductSummaryDto,
} from "@/features/catalog/catalog.types";
import type { PageResponse } from "@/lib/api";
import { renderWithProviders } from "../utils";

vi.mock("@/features/catalog/catalog.api");

const mockGames: GameDto[] = [
  {
    id: 1,
    code: "YGO",
    name: "Yu-Gi-Oh!",
    nameLocal: "ยูกิโอ",
    slug: "yu-gi-oh",
    logoUrl: null,
    displayOrder: 1,
  },
  {
    id: 2,
    code: "PKM",
    name: "Pokemon TCG",
    nameLocal: "โปเกมอน",
    slug: "pokemon-tcg",
    logoUrl: null,
    displayOrder: 2,
  },
];

const mockCategories: CategoryDto[] = [
  {
    id: 1,
    gameId: null,
    parentId: null,
    code: "SINGLE",
    name: "Single Cards",
    slug: "single-cards",
    displayOrder: 1,
    imageUrl: null,
  },
];

function makeProduct(id: number, name: string, gameId = 1): ProductSummaryDto {
  return {
    id,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    nameLocal: null,
    gameId,
    categoryId: 1,
    cardSetId: 1,
    productType: "SINGLE_CARD",
    cardNumber: "001",
    rarityCode: "UR",
    primaryImageUrl: "https://example.com/card.jpg",
    variantCount: 1,
    lowestPrice: 150,
    listingCount: 3,
  };
}

function makePage(items: ProductSummaryDto[]): PageResponse<ProductSummaryDto> {
  return {
    items,
    page: 0,
    size: 20,
    totalItems: items.length,
    totalPages: 1,
  };
}

describe("Catalog Search and Filter Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();

    vi.mocked(catalogApi.getGames).mockResolvedValue(mockGames);
    vi.mocked(catalogApi.getCategories).mockResolvedValue(mockCategories);
  });

  it("renders search results with game filters and products", async () => {
    const products = [
      makeProduct(1, "Blue-Eyes White Dragon", 1),
      makeProduct(2, "Charizard Base Set", 2),
    ];
    vi.mocked(catalogApi.getProducts).mockResolvedValue(makePage(products));

    renderWithProviders(<SearchResultsPage />, { route: "/search" });

    // Header and results count
    expect(await screen.findByText("All products")).toBeInTheDocument();
    expect(await screen.findByText("2 results")).toBeInTheDocument();

    // Filters rendered
    expect(screen.getByText("Yu-Gi-Oh!")).toBeInTheDocument();
    expect(screen.getByText("Pokemon TCG")).toBeInTheDocument();

    // Products rendered
    expect(screen.getByText("Blue-Eyes White Dragon")).toBeInTheDocument();
    expect(screen.getByText("Charizard Base Set")).toBeInTheDocument();
  });

  it("filters products by game checkbox", async () => {
    const user = userEvent.setup();
    const allProducts = [
      makeProduct(1, "Blue-Eyes White Dragon", 1),
      makeProduct(2, "Charizard Base Set", 2),
    ];
    vi.mocked(catalogApi.getProducts).mockResolvedValue(makePage(allProducts));

    renderWithProviders(<SearchResultsPage />, { route: "/search" });

    expect(await screen.findByText("Blue-Eyes White Dragon")).toBeInTheDocument();

    // Toggle Yu-Gi-Oh! filter
    const ygoCheckbox = screen.getByRole("checkbox", { name: "Yu-Gi-Oh!" });
    await user.click(ygoCheckbox);

    await waitFor(() => {
      expect(catalogApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: [1],
        }),
      );
    });
  });

  it("renders empty state when no products match query", async () => {
    vi.mocked(catalogApi.getProducts).mockResolvedValue(makePage([]));

    renderWithProviders(<SearchResultsPage />, { route: "/search?q=NonExistentCard" });

    expect(
      await screen.findByText(/No products match "NonExistentCard"/i),
    ).toBeInTheDocument();
  });

  it("renders error state when product query fails", async () => {
    vi.mocked(catalogApi.getProducts).mockRejectedValue(new Error("API failure"));

    renderWithProviders(<SearchResultsPage />, { route: "/search" });

    expect(await screen.findByText("ค้นหาไม่สำเร็จ")).toBeInTheDocument();
  });
});
