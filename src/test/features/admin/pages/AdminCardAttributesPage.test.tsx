import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as catalogApi from "@/features/admin/catalog.api";
import type { CardSet, CatalogCategory, Game, GameAttribute } from "@/features/admin/catalog.types";
import { AdminCardAttributesPage } from "@/features/admin/pages/AdminCardAttributesPage";
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
    displayOrder: 1,
    active: true,
    createdBy: 1,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const mockAttributes: GameAttribute[] = [
  {
    id: 11,
    gameId: 1,
    attrKey: "hp",
    label: "HP",
    dataType: "NUMBER",
    options: [],
    filterable: true,
    required: true,
    displayOrder: 1,
  },
];

const mockCardSets: CardSet[] = [
  {
    id: 21,
    gameId: 1,
    code: "SV8A",
    name: "Terastal Festival",
    nameLocal: null,
    releaseDate: "2026-10-01",
    totalCards: 187,
    logoUrl: null,
  },
];

const mockCategories: CatalogCategory[] = [
  {
    id: 31,
    gameId: 1,
    parentId: null,
    code: "CARDS",
    name: "Trading Cards",
    slug: "trading-cards",
    displayOrder: 1,
    active: true,
    imageKey: null,
  },
];

describe("AdminCardAttributesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogApi.getProducts).mockResolvedValue({
      items: [],
      page: 0,
      size: 1,
      totalItems: 0,
      totalPages: 0,
    } as unknown as PageResponse<never>);
  });

  it("renders page title, game list, attribute fields, and supports tab switching", async () => {
    vi.mocked(catalogApi.getGames).mockResolvedValue(mockGames);
    vi.mocked(catalogApi.getGameAttributes).mockResolvedValue(mockAttributes);
    vi.mocked(catalogApi.getCardSets).mockResolvedValue(mockCardSets);
    vi.mocked(catalogApi.getCategories).mockResolvedValue(mockCategories);

    const user = userEvent.setup();
    renderWithProviders(<AdminCardAttributesPage />, { route: "/admin/card-attributes" });

    // Page Header
    expect(screen.getByText("เกมและคุณสมบัติการ์ด")).toBeInTheDocument();

    // Game name & Attributes table
    const gameTitles = await screen.findAllByText("Pokémon");
    expect(gameTitles.length).toBeGreaterThan(0);
    expect(await screen.findByText("HP")).toBeInTheDocument();

    // Switch to sets tab
    const setsTab = screen.getByRole("tab", { name: /ชุดการ์ด/i });
    await user.click(setsTab);
    expect(await screen.findByText("Terastal Festival")).toBeInTheDocument();

    // Switch to categories tab
    const categoriesTab = screen.getByRole("tab", { name: /หมวดหมู่/i });
    await user.click(categoriesTab);
    expect(await screen.findByText("Trading Cards")).toBeInTheDocument();
  });

  it("renders error state when loading games fails", async () => {
    vi.mocked(catalogApi.getGames).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminCardAttributesPage />, { route: "/admin/card-attributes" });

    expect(await screen.findByText("โหลดรายชื่อเกมไม่สำเร็จ")).toBeInTheDocument();
  });
});
