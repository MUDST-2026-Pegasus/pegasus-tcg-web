import { describe, expect, it } from "vitest";

import { clearedFilters, readFilters, toProductQuery, writeFilters } from "@/features/catalog/search.params";

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
