import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import * as catalogApi from "@/features/admin/catalog.api";
import type { Game, ProductSummary } from "@/features/admin/catalog.types";
import { AdminCatalogPage } from "@/features/admin/pages/AdminCatalogPage";
import type { PageResponse } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/catalog.api", () => ({
  getGames: vi.fn(),
  getGameAttributes: vi.fn(),
  getCardSets: vi.fn(),
  getCategories: vi.fn(),
  getProducts: vi.fn(),
}));

const mockGames: Game[] = [
  {
    id: 1,
    code: "POKEMON",
    name: "Pokémon",
    nameLocal: "โปเกมอน",
    slug: "pokemon",
    logoUrl: null,
    logoImageUrl: null,
    displayOrder: 1,
    active: true,
    createdBy: 1,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const mockProducts: ProductSummary[] = [
  {
    id: 10,
    slug: "pikachu-base-set",
    name: "Pikachu Base Set",
    nameLocal: null,
    gameId: 1,
    categoryId: 1,
    cardSetId: 1,
    productType: "SINGLE_CARD",
    cardNumber: "58/102",
    rarityCode: "COMMON",
    attributes: {},
    primaryImageUrl: null,
    variantCount: 2,
    lowestPrice: 150,
    listingCount: 3,
  },
];

function mockProductPage(items: ProductSummary[]): PageResponse<ProductSummary> {
  return {
    items,
    page: 0,
    size: 24,
    totalItems: items.length,
    totalPages: 1,
  };
}

describe("AdminCatalogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogApi.getGameAttributes).mockResolvedValue([]);
    vi.mocked(catalogApi.getCardSets).mockResolvedValue([]);
    vi.mocked(catalogApi.getCategories).mockResolvedValue([]);
  });

  it("renders catalog header, game filter panel, and product grid", async () => {
    vi.mocked(catalogApi.getGames).mockResolvedValue(mockGames);
    vi.mocked(catalogApi.getProducts).mockResolvedValue(mockProductPage(mockProducts));

    renderWithProviders(<AdminCatalogPage />, { route: "/admin/catalog" });

    // Page Title
    expect(screen.getByText("จัดการแคตตาล็อก")).toBeInTheDocument();
    expect(screen.getByText(/ฐานข้อมูลการ์ดกลางของแพลตฟอร์ม/i)).toBeInTheDocument();

    // Game in filter panel
    expect(await screen.findByText("Pokémon")).toBeInTheDocument();

    // Product Card in Grid
    expect(await screen.findByText(/Pikachu Base Set/i)).toBeInTheDocument();
  });

  it("renders error state when loading games fails", async () => {
    vi.mocked(catalogApi.getGames).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminCatalogPage />, { route: "/admin/catalog" });

    expect(await screen.findByText("โหลดรายชื่อเกมไม่สำเร็จ")).toBeInTheDocument();
  });
});
