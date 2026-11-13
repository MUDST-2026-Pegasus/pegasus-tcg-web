import { describe, expect, it } from "vitest";

import { clearedFilters, readFilters, switchTab, toProductQuery, toShopQuery, writeFilters } from "@/features/catalog/search.params";

describe("search URL params [TCG-777]", () => {
  it("round-trips onSale, view and page", () => {
    const filters = readFilters(new URLSearchParams("q=char&onSale=true&view=list&page=3&condition=NM"));
    expect(filters).toMatchObject({ q: "char", onSale: true, view: "list", page: 3, conditions: ["NM"] });
    expect(writeFilters(filters).toString()).toBe("q=char&condition=NM&onSale=true&view=list&page=3");
  });

  it("ignores an unknown view", () => {
    expect(readFilters(new URLSearchParams("view=table")).view).toBeNull();
  });

  it("sends onSale and 24 per page to the API", () => {
    const { query } = toProductQuery(readFilters(new URLSearchParams("onSale=true&page=2")), [], []);
    expect(query).toMatchObject({ onSale: true, page: 1, size: 24 });
  });

  it("clears filters but keeps q, sort and view", () => {
    const filters = readFilters(new URLSearchParams("q=char&game=pokemon-tcg&min=500&onSale=true&sort=newest&view=list&page=4"));
    expect(writeFilters(clearedFilters(filters)).toString()).toBe("q=char&sort=newest&view=list");
  });
});

describe("search tabs [TCG-778]", () => {
  it("reads and writes the shops tab, rating and shop sort", () => {
    const filters = readFilters(new URLSearchParams("q=charizard&tab=shops&rating=4.5&shopSort=RATING"));
    expect(filters).toMatchObject({ tab: "shops", minRating: "4.5", shopSort: "RATING" });
    expect(writeFilters(filters).toString()).toBe("q=charizard&tab=shops&rating=4.5&shopSort=RATING");
    expect(readFilters(new URLSearchParams("tab=nope&rating=3")).tab).toBe("products");
    expect(readFilters(new URLSearchParams("rating=3")).minRating).toBeNull();
  });

  it("keeps q and the game filter when switching tabs, and resets the page", () => {
    const filters = readFilters(new URLSearchParams("q=charizard&game=pokemon-tcg&condition=NM&page=3"));
    expect(writeFilters(switchTab(filters, "shops")).toString()).toBe("q=charizard&game=pokemon-tcg&condition=NM&tab=shops");
  });

  it("builds the shop query", () => {
    const filters = readFilters(new URLSearchParams("q=charizard&game=pokemon-tcg&tab=shops&rating=4&page=2"));
    const { query, ready } = toShopQuery(filters, [
      { id: 1, code: "POKEMON", name: "Pokémon TCG", nameLocal: null, slug: "pokemon-tcg", logoUrl: null, displayOrder: 1 },
    ]);
    expect(ready).toBe(true);
    expect(query).toEqual({ q: "charizard", gameId: [1], minRating: 4, sort: "MATCHES", page: 1, size: 10 });
  });
});
