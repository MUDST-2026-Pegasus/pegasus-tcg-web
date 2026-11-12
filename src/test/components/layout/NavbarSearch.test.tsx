import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";

import {
  DesktopNavbarSearch,
  MobileNavbarSearch,
} from "@/features/catalog/components/search/NavbarSearch";
import { useNavbarSearch } from "@/features/catalog/search/use-navbar-search";
import * as catalogApi from "@/features/catalog/catalog.api";
import type { SearchSuggestDto } from "@/features/catalog/catalog.types";
import { RECENT_SEARCHES_KEY } from "@/features/catalog/search/search-history";
import { createTestQueryClient, render } from "@/test/utils";

const suggestion: SearchSuggestDto = {
  query: "char",
  correctedQuery: null,
  correctionReason: null,
  completions: ["charizard ex", "charizard vmax"],
  scopes: [
    { type: "GAME", id: 1, name: "Pokémon TCG", count: 240 },
    { type: "CATEGORY", id: 7, name: "การ์ดเกรด", count: 18 },
  ],
  products: [
    {
      id: 10,
      slug: "charizard-vmax-020",
      name: "Charizard VMAX #020",
      setName: "Darkness Ablaze",
      cardNumber: "020/189",
      gameName: "Pokémon",
      imageUrl: null,
      lowestPrice: 4290,
      sellerCount: 12,
    },
  ],
  shops: [
    {
      username: "charizard-vault",
      displayName: "Charizard Vault BKK",
      avatarUrl: null,
      ratingAvg: 4.9,
      ratingCount: 312,
      matchCount: 54,
    },
  ],
  totalProducts: 248,
};

const getSuggest = vi.spyOn(catalogApi, "getSearchSuggest");
const getTrending = vi.spyOn(catalogApi, "getTrendingSearches");
vi.spyOn(catalogApi, "getGames").mockResolvedValue([
  { id: 1, code: "POKEMON", name: "Pokémon TCG", nameLocal: null, slug: "pokemon-tcg", logoUrl: null, displayOrder: 1 },
  { id: 2, code: "ONE_PIECE", name: "One Piece", nameLocal: null, slug: "one-piece-card-game", logoUrl: null, displayOrder: 2 },
]);
vi.spyOn(catalogApi, "getCategories").mockResolvedValue([
  { id: 7, gameId: null, parentId: null, code: "GRADED", name: "การ์ดเกรด", slug: "graded-cards", displayOrder: 1, imageUrl: null },
] as never);

function Location() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function Harness() {
  const search = useNavbarSearch();
  return (
    <>
      <DesktopNavbarSearch search={search} inputRef={null} />
      <MobileNavbarSearch search={search} inputRef={null} />
    </>
  );
}

function renderSearch(path = "/") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Harness />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const combobox = () => screen.getByRole("combobox", { name: "ค้นหา" });
const location = () => screen.getByTestId("location");

async function typeAndWait(value: string) {
  fireEvent.focus(combobox());
  fireEvent.change(combobox(), { target: { value } });
  await screen.findByRole("option", { name: /Charizard VMAX #020/ });
}

describe("Navbar search autocomplete [TCG-776]", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getSuggest.mockReset().mockResolvedValue(suggestion);
    getTrending.mockReset().mockResolvedValue([
      { query: "charizard ex sar", rank: 1 },
      { query: "op-09 booster box", rank: 2 },
    ]);
  });

  it("shows recent searches, popular games and trending when focused with an empty box", async () => {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(["pikachu promo", "luffy gear 5"]));
    renderSearch();
    fireEvent.focus(combobox());

    expect(combobox()).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("listbox");
    expect(within(list).getByRole("option", { name: /pikachu promo/ })).toBeInTheDocument();
    expect(await within(list).findByRole("option", { name: "Pokémon TCG" })).toHaveAttribute(
      "href",
      "/search?game=pokemon-tcg",
    );
    expect(await within(list).findByRole("option", { name: /charizard ex sar/ })).toBeInTheDocument();
    expect(getSuggest).not.toHaveBeenCalled();
  });

  it("removes one recent search and clears them all", async () => {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(["pikachu promo", "luffy gear 5"]));
    renderSearch();
    fireEvent.focus(combobox());

    fireEvent.click(screen.getByRole("button", { name: "ลบ “pikachu promo” ออกจากประวัติ" }));
    expect(screen.queryByRole("option", { name: /pikachu promo/ })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY)!)).toEqual(["luffy gear 5"]);

    fireEvent.click(screen.getByRole("button", { name: "ล้าง" }));
    expect(screen.queryByRole("option", { name: /luffy gear 5/ })).not.toBeInTheDocument();
  });

  it("shows completions, scopes, products and shops for a typed query", async () => {
    renderSearch();
    await typeAndWait("char");

    expect(getSuggest).toHaveBeenCalledWith("char", expect.any(AbortSignal));
    expect(screen.getByRole("option", { name: /charizard ex/ })).toHaveAttribute("href", "/search?q=charizard+ex");
    expect(await screen.findByRole("option", { name: "Pokémon TCG" })).toHaveAttribute(
      "href",
      "/search?q=char&game=pokemon-tcg",
    );
    expect(screen.getByRole("option", { name: "การ์ดเกรด · 18" })).toHaveAttribute(
      "href",
      "/search?q=char&category=graded-cards",
    );
    expect(screen.getByRole("option", { name: /Charizard VMAX #020/ })).toHaveAttribute(
      "href",
      "/products/charizard-vmax-020",
    );
    expect(screen.getByRole("option", { name: /Charizard Vault BKK/ })).toHaveAttribute("href", "/u/charizard-vault");
    expect(screen.getByRole("status")).toHaveTextContent("พบสินค้า 248 รายการ");
  });

  it("shows how the query was interpreted", async () => {
    getSuggest.mockResolvedValue({
      ...suggestion,
      query: "ชาริซาร์ด",
      correctedQuery: "Charizard",
      correctionReason: "ALIAS",
    });
    renderSearch();
    await typeAndWait("ชาริซาร์ด");
    expect(screen.getByText("แสดงผลของ “Charizard” · คุณพิมพ์ “ชาริซาร์ด”")).toBeInTheDocument();
  });

  it("moves the highlight with the arrow keys and opens the highlighted row with Enter", async () => {
    renderSearch();
    await typeAndWait("char");
    const input = combobox();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const first = screen.getByRole("option", { name: /charizard ex/ });
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", first.id);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    const last = screen.getAllByRole("option").at(-1)!;
    expect(input).toHaveAttribute("aria-activedescendant", last.id);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(location()).toHaveTextContent("/search?q=charizard+vmax");
    expect(JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY)!)).toEqual(["charizard vmax"]);
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("goes to the product page when a product suggestion is clicked", async () => {
    renderSearch();
    await typeAndWait("char");
    fireEvent.click(screen.getByRole("option", { name: /Charizard VMAX #020/ }));
    expect(location()).toHaveTextContent("/products/charizard-vmax-020");
    expect(JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY)!)).toEqual(["char"]);
  });

  it("plain Enter searches and keeps the current filters on /search", async () => {
    renderSearch("/search?game=pokemon-tcg&page=3&q=old");
    fireEvent.focus(combobox());
    fireEvent.change(combobox(), { target: { value: "Pikachu" } });
    fireEvent.submit(combobox().closest("form")!);
    expect(location()).toHaveTextContent("/search?game=pokemon-tcg&q=Pikachu");
  });

  it("shows skeleton rows while loading and a retry when products fail", async () => {
    let fail!: (error: Error) => void;
    getSuggest.mockImplementation(() => new Promise((_, reject) => (fail = reject)));
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(["charizard 151"]));
    renderSearch();
    fireEvent.focus(combobox());
    fireEvent.change(combobox(), { target: { value: "char" } });

    expect(screen.getAllByTestId("suggest-skeleton")).toHaveLength(4);
    expect(screen.getByRole("option", { name: /charizard 151/ })).toBeInTheDocument();

    await waitFor(() => expect(getSuggest).toHaveBeenCalled());
    await act(async () => fail(new Error("offline")));
    expect(within(await screen.findByRole("alert")).getByText("โหลดสินค้าไม่สำเร็จ")).toBeInTheDocument();

    getSuggest.mockResolvedValue(suggestion);
    fireEvent.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
    expect(await screen.findByRole("option", { name: /Charizard VMAX #020/ })).toBeInTheDocument();
  });

  it("shows the no-results state with a did-you-mean link", async () => {
    getSuggest.mockResolvedValue({
      ...suggestion,
      query: "chxrizrd",
      correctedQuery: "charizard",
      completions: [],
      scopes: [],
      products: [],
      shops: [],
      totalProducts: 0,
    });
    renderSearch();
    fireEvent.focus(combobox());
    fireEvent.change(combobox(), { target: { value: "chxrizrd" } });

    expect(await within(screen.getByRole("listbox")).findByText("ไม่พบผลลัพธ์สำหรับ “chxrizrd”")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "charizard" })).toHaveAttribute("href", "/search?q=charizard");
    expect(await screen.findByRole("option", { name: "charizard ex sar" })).toBeInTheDocument();
  });

  it("closes on Escape and on a click outside", async () => {
    renderSearch();
    fireEvent.focus(combobox());
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(combobox(), { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.focus(combobox());
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens a full-screen search on mobile with a back button", async () => {
    renderSearch();
    fireEvent.click(screen.getByRole("textbox", { name: "ค้นหา" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("combobox", { name: "ค้นหา" })).toHaveFocus();
    fireEvent.change(within(dialog).getByRole("combobox"), { target: { value: "char" } });
    expect(await within(dialog).findByRole("option", { name: /Charizard VMAX #020/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("option", { name: /ดูผลการค้นหาทั้งหมดของ “char”/ })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "กลับ" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
