import { describe, expect, it } from "vitest";

import { SearchOptionList, moveHighlight, searchHref } from "@/features/catalog/search/search-options";

describe("search dropdown keyboard navigation [TCG-776]", () => {
  it("moves down and up with wrap-around", () => {
    expect(moveHighlight(-1, 3, "ArrowDown")).toBe(0);
    expect(moveHighlight(0, 3, "ArrowDown")).toBe(1);
    expect(moveHighlight(2, 3, "ArrowDown")).toBe(0);
    expect(moveHighlight(-1, 3, "ArrowUp")).toBe(2);
    expect(moveHighlight(0, 3, "ArrowUp")).toBe(2);
    expect(moveHighlight(2, 3, "ArrowUp")).toBe(1);
  });

  it("has nothing to highlight in an empty list", () => {
    expect(moveHighlight(-1, 0, "ArrowDown")).toBe(-1);
  });

  it("numbers option ids in render order", () => {
    const list = new SearchOptionList("opt");
    expect(list.add("/a", "a")).toMatchObject({ id: "opt-0", index: 0 });
    expect(list.add("/b")).toMatchObject({ id: "opt-1", index: 1 });
    expect(list.items.map((item) => item.href)).toEqual(["/a", "/b"]);
  });
});

describe("searchHref", () => {
  const home = { pathname: "/", params: new URLSearchParams("x=1") };
  const onSearch = { pathname: "/search", params: new URLSearchParams("game=pokemon-tcg&page=3&q=old") };

  it("starts fresh outside /search", () => {
    expect(searchHref(" char ", home)).toBe("/search?q=char");
    expect(searchHref("", home)).toBe("/search");
  });

  it("keeps filters on /search and resets the page", () => {
    expect(searchHref("Pikachu", onSearch)).toBe("/search?game=pokemon-tcg&q=Pikachu");
    expect(searchHref("", onSearch)).toBe("/search?game=pokemon-tcg");
  });

  it("scopes to one game or category", () => {
    expect(searchHref("char", onSearch, { category: "graded" })).toBe("/search?q=char&category=graded");
  });
});
