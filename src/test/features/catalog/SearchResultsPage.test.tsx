import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";

import * as catalogApi from "@/features/catalog/catalog.api";
import type { ProductSummaryDto, SearchFacetsDto } from "@/features/catalog/catalog.types";
import { SearchResultsPage } from "@/features/catalog/pages/SearchResultsPage";
import { ApiError, type PageResponse } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/catalog/catalog.api");

const games = [
  { id: 1, code: "POKEMON", name: "Pokémon TCG", nameLocal: null, slug: "pokemon-tcg", logoUrl: null, displayOrder: 1 },
  { id: 2, code: "ONE_PIECE", name: "One Piece Card Game", nameLocal: null, slug: "one-piece-card-game", logoUrl: null, displayOrder: 2 },
];
const categories = [
  { id: 5, gameId: null, parentId: null, code: "SINGLE", name: "การ์ดเดี่ยว", slug: "single-cards", displayOrder: 1, imageUrl: null },
];

const product = (id: number, overrides: Partial<ProductSummaryDto> = {}): ProductSummaryDto => ({
  id,
  slug: `charizard-${id}`,
  name: `Charizard ${id}`,
  nameLocal: null,
  gameId: 1,
  categoryId: 5,
  cardSetId: null,
  productType: "SINGLE_CARD",
  cardNumber: "020/189",
  rarityCode: null,
  primaryImageUrl: null,
  variantCount: 1,
  lowestPrice: 690,
  listingCount: 8,
  highestPrice: 930,
  lowestRegularPrice: 690,
  sellerCount: 5,
  onSale: false,
  ...overrides,
});

const page = (items: ProductSummaryDto[], extra: Partial<PageResponse<ProductSummaryDto>> = {}) => ({
  items,
  page: 0,
  size: 24,
  totalItems: 248,
  totalPages: 11,
  ...extra,
});

const facets: SearchFacetsDto = {
  games: [{ id: 1, name: "Pokémon TCG", parentId: null, count: 201 }],
  categories: [{ id: 5, name: "การ์ดเดี่ยว", parentId: null, count: 201 }],
  conditions: [{ code: "NM", count: 120 }],
  onSaleCount: 14,
  totals: { products: 248, shops: 32, listings: 1034 },
};

function Location() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderPage(route = "/search?q=charizard") {
  return renderWithProviders(
    <>
      <SearchResultsPage />
      <Location />
    </>,
    { route },
  );
}

describe("SearchResultsPage [TCG-777]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    vi.mocked(catalogApi.getGames).mockResolvedValue(games);
    vi.mocked(catalogApi.getCategories).mockResolvedValue(categories as never);
    vi.mocked(catalogApi.getSearchFacets).mockResolvedValue(facets);
    vi.mocked(catalogApi.getSearchSuggest).mockResolvedValue({
      query: "charizard",
      correctedQuery: null,
      correctionReason: null,
      completions: ["charizard ex", "charizard 151"],
      scopes: [],
      products: [],
      shops: [],
      totalProducts: 248,
    });
    vi.mocked(catalogApi.getProducts).mockResolvedValue(
      page([product(1), product(2, { lowestPrice: 1850, lowestRegularPrice: 2500, onSale: true })]),
    );
  });

  it("shows the title, totals, tab counts and cards", async () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ผลการค้นหา “charizard”");
    expect(await screen.findByText("พบ 248 สินค้า จาก 32 ร้านค้า")).toBeInTheDocument();
    const tabs = screen.getByRole("navigation", { name: "ประเภทผลการค้นหา" });
    expect(within(tabs).getByText("1,034")).toBeInTheDocument();
    expect(await screen.findAllByTestId("search-result-card")).toHaveLength(2);
    expect(screen.getByText("-26%")).toBeInTheDocument();
    expect(screen.getByText("แสดง 1–24 จาก 248 สินค้า")).toBeInTheDocument();
  });

  it("shows facet counts and disables options with no results", async () => {
    renderPage();
    const sidebar = screen.getByRole("complementary", { name: "ตัวกรองการค้นหา" });
    await waitFor(() => expect(within(sidebar).getByRole("checkbox", { name: /Pokémon TCG/ })).toBeEnabled());
    expect(within(sidebar).getByRole("checkbox", { name: /One Piece Card Game/ })).toHaveAttribute("aria-disabled", "true");
    expect(within(sidebar).getByRole("button", { name: "NM" })).toBeEnabled();
    expect(within(sidebar).getByRole("button", { name: "LP" })).toBeDisabled();
  });

  it("writes filters to the URL, resets the page and sends them to the API", async () => {
    const user = userEvent.setup();
    renderPage("/search?q=charizard&page=3");
    const sidebar = screen.getByRole("complementary", { name: "ตัวกรองการค้นหา" });
    await user.click(await within(sidebar).findByRole("checkbox", { name: /Pokémon TCG/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard&game=pokemon-tcg");

    await user.click(within(sidebar).getByRole("switch", { name: /กำลังลดราคา/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard&game=pokemon-tcg&onSale=true");
    await waitFor(() =>
      expect(catalogApi.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "charizard", gameId: [1], onSale: true, page: 0, size: 24 }),
        expect.any(AbortSignal),
      ),
    );
    expect(catalogApi.getSearchFacets).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ sort: expect.anything() }),
      expect.any(AbortSignal),
    );
  });

  it("removes a filter with its chip and clears them all", async () => {
    const user = userEvent.setup();
    renderPage("/search?q=charizard&game=pokemon-tcg&condition=NM&sort=newest");
    await user.click(await screen.findByRole("button", { name: "เอา “NM” ออก" }));
    expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard&game=pokemon-tcg&sort=newest");

    await user.click(screen.getAllByRole("button", { name: "ล้างทั้งหมด" })[0]);
    expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard&sort=newest");
  });

  it("switches to the list view and remembers it", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByTestId("search-result-card");
    await user.click(screen.getByRole("button", { name: "รายการ" }));

    expect(screen.getByTestId("location")).toHaveTextContent("view=list");
    expect(window.localStorage.getItem("pegasus.search.view")).toBe("list");
    const rows = await screen.findAllByTestId("search-result-row");
    expect(within(rows[0]).getByText("5 ร้าน · 8 รายการ")).toBeInTheDocument();
    expect(within(rows[0]).getByRole("button", { name: "ดูรายการขาย" })).toHaveAttribute(
      "href",
      "/products/charizard-1/listings",
    );
  });

  it("explains an alias match and a typo correction", async () => {
    vi.mocked(catalogApi.getProducts).mockResolvedValue(
      page([product(1)], { correctedQuery: "Pokémon", correctionReason: "ALIAS" }),
    );
    const { unmount } = renderPage("/search?q=โปเกมอน");
    expect(await screen.findByText("รวมผลของ “Pokémon” สำหรับ “โปเกมอน”")).toBeInTheDocument();
    unmount();

    vi.mocked(catalogApi.getProducts).mockResolvedValue(
      page([product(1)], { correctedQuery: "Pokemon", correctionReason: "TYPO" }),
    );
    renderPage("/search?q=pokamon");
    expect(await screen.findByText("แสดงผลลัพธ์ของ “Pokemon” · คุณค้นหา “pokamon”")).toBeInTheDocument();
  });

  it("shows related searches as links", async () => {
    renderPage();
    expect(await screen.findByRole("link", { name: "charizard ex" })).toHaveAttribute("href", "/search?q=charizard+ex");
  });

  it("shows the no-results state with did-you-mean and popular products", async () => {
    vi.mocked(catalogApi.getProducts).mockImplementation(async (query) =>
      query.sort === "popular" ? page([product(9)], { totalItems: 1 }) : page([], { totalItems: 0, totalPages: 0 }),
    );
    vi.mocked(catalogApi.getSearchSuggest).mockResolvedValue({
      query: "chxrizrd",
      correctedQuery: null,
      correctionReason: null,
      completions: ["charizard"],
      scopes: [],
      products: [],
      shops: [],
      totalProducts: 0,
    });
    renderPage("/search?q=chxrizrd&game=pokemon-tcg");

    expect(await screen.findByText('ไม่พบสินค้าที่ตรงกับ "chxrizrd"')).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "ค้นหา “charizard” แทน" })).toHaveAttribute("href", "/search?q=charizard");
    expect(screen.getByRole("button", { name: "ล้างตัวกรองทั้งหมด" })).toBeInTheDocument();
    expect(await screen.findByText("สินค้ายอดนิยมตอนนี้")).toBeInTheDocument();
    expect(screen.getByText("Charizard 9")).toBeInTheDocument();
  });

  it("shows the error code and retries without losing filters", async () => {
    const user = userEvent.setup();
    vi.mocked(catalogApi.getProducts).mockRejectedValueOnce(
      new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE" as never, message: "down" }),
    );
    renderPage("/search?q=charizard&game=pokemon-tcg");

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("โหลดผลการค้นหาไม่สำเร็จ")).toBeInTheDocument();
    expect(within(alert).getByText("รหัส: SERVICE_UNAVAILABLE")).toBeInTheDocument();
    expect(within(alert).getByRole("button", { name: "กลับหน้าแรก" })).toHaveAttribute("href", "/");

    await user.click(within(alert).getByRole("button", { name: "ลองอีกครั้ง" }));
    expect(await screen.findAllByTestId("search-result-card")).toHaveLength(2);
    expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard&game=pokemon-tcg");
  });

  describe("shops tab [TCG-778]", () => {
    const shop = {
      username: "charizard-vault",
      displayName: "Charizard Vault BKK",
      avatarUrl: null,
      ratingAvg: 4.9,
      ratingCount: 312,
      matchCount: 54,
      lowestPrice: 420,
      previews: [
        { productId: 11, imageUrl: null },
        { productId: 12, imageUrl: null },
        { productId: 13, imageUrl: null },
      ],
    };

    beforeEach(() => {
      vi.mocked(catalogApi.getSearchShops).mockResolvedValue({
        items: [shop],
        page: 0,
        size: 10,
        totalItems: 12,
        totalPages: 2,
      });
    });

    it("switches tabs through the URL and keeps q and the game filter", async () => {
      const user = userEvent.setup();
      renderPage("/search?q=charizard&game=pokemon-tcg&page=2");
      const tabs = screen.getByRole("navigation", { name: "ประเภทผลการค้นหา" });
      await user.click(within(tabs).getByRole("link", { name: /ร้านค้า/ }));

      expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard&game=pokemon-tcg&tab=shops");
      expect(await screen.findByTestId("shop-result")).toBeInTheDocument();
      expect(catalogApi.getSearchShops).toHaveBeenCalledWith(
        { q: "charizard", gameId: [1], sort: "MATCHES", page: 0, size: 10 },
        expect.any(AbortSignal),
      );

      await user.click(within(tabs).getByRole("link", { name: /สินค้า/ }));
      expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard&game=pokemon-tcg");
    });

    it("maps a shop to its card", async () => {
      renderPage("/search?q=charizard&tab=shops");
      const card = await screen.findByTestId("shop-result");
      expect(within(card).getByRole("link", { name: "Charizard Vault BKK" })).toHaveAttribute("href", "/u/charizard-vault");
      expect(within(card).getByText("4.9 (312 รีวิว)")).toBeInTheDocument();
      expect(within(card).getByText(/54 สินค้าที่ตรงกับ “charizard”/)).toHaveTextContent("เริ่มต้น THB 420.00");
      const previews = within(card).getAllByRole("link", { name: "สินค้าตัวอย่างจาก Charizard Vault BKK" });
      expect(previews.map((link) => link.getAttribute("href"))).toEqual(["/products/11", "/products/12", "/products/13"]);
      expect(within(card).getByRole("link", { name: "+51" })).toHaveAttribute("href", "/u/charizard-vault");
      expect(within(card).getByRole("button", { name: "ดูร้าน" })).toHaveAttribute("href", "/u/charizard-vault");
      expect(screen.getByText("แสดง 1–10 จาก 12 ร้านค้า")).toBeInTheDocument();
      expect(screen.getByText("พบ 32 ร้านค้าที่ขาย “charizard”")).toBeInTheDocument();
    });

    it("sends the rating filter and shop sort", async () => {
      const user = userEvent.setup();
      renderPage("/search?q=charizard&tab=shops");
      await screen.findByTestId("shop-result");
      const sidebar = screen.getByRole("complementary", { name: "ตัวกรองการค้นหา" });
      await user.click(within(sidebar).getByRole("button", { name: /4\.5 ขึ้นไป/ }));

      expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard&tab=shops&rating=4.5");
      await waitFor(() =>
        expect(catalogApi.getSearchShops).toHaveBeenLastCalledWith(
          expect.objectContaining({ minRating: 4.5, sort: "MATCHES" }),
          expect.any(AbortSignal),
        ),
      );
    });

    it("tells when no shop sells the term and links back to products", async () => {
      const user = userEvent.setup();
      vi.mocked(catalogApi.getSearchShops).mockResolvedValue({ items: [], page: 0, size: 10, totalItems: 0, totalPages: 0 });
      renderPage("/search?q=charizard&tab=shops");
      expect(await screen.findByText("ไม่มีร้านที่ขาย “charizard”")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "กลับไปดูสินค้า" }));
      expect(screen.getByTestId("location")).toHaveTextContent("?q=charizard");
      expect(screen.getByTestId("location")).not.toHaveTextContent("tab=shops");
    });

    it("shows a loading skeleton and an error with retry", async () => {
      const user = userEvent.setup();
      vi.mocked(catalogApi.getSearchShops).mockRejectedValueOnce(new Error("down"));
      renderPage("/search?q=charizard&tab=shops");
      expect(screen.getByTestId("shop-skeleton")).toBeInTheDocument();
      const alert = await screen.findByRole("alert");
      expect(within(alert).getByText("โหลดร้านค้าไม่สำเร็จ")).toBeInTheDocument();
      await user.click(within(alert).getByRole("button", { name: "ลองอีกครั้ง" }));
      expect(await screen.findByTestId("shop-result")).toBeInTheDocument();
    });
  });
});
