import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RECENT_SEARCHES_KEY,
  addRecentSearch,
  addViewedProduct,
  clearRecentSearches,
  readRecentSearches,
  readViewedProducts,
  removeRecentSearch,
  subscribeSearchHistory,
} from "@/features/catalog/search/search-history";

describe("recent searches [TCG-776]", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("keeps the newest first, without duplicates (ignoring case), capped at 8", () => {
    for (const term of ["a", "b", "c", "d", "e", "f", "g", "h", "i"]) addRecentSearch(term);
    addRecentSearch("  E ");

    expect(readRecentSearches()).toEqual(["E", "i", "h", "g", "f", "d", "c", "b"]);
    expect(JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY)!)).toHaveLength(8);
  });

  it("ignores blank terms", () => {
    addRecentSearch("   ");
    expect(readRecentSearches()).toEqual([]);
  });

  it("removes one term and clears all", () => {
    addRecentSearch("pikachu");
    addRecentSearch("luffy");
    removeRecentSearch("PIKACHU");
    expect(readRecentSearches()).toEqual(["luffy"]);

    clearRecentSearches();
    expect(readRecentSearches()).toEqual([]);
    expect(window.localStorage.getItem(RECENT_SEARCHES_KEY)).toBeNull();
  });

  it("notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSearchHistory(listener);
    addRecentSearch("charizard");
    unsubscribe();
    addRecentSearch("pikachu");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("survives broken JSON and storage that throws (private mode)", () => {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, "{not json");
    expect(readRecentSearches()).toEqual([]);

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "QuotaExceededError");
    });
    expect(() => addRecentSearch("charizard")).not.toThrow();
    expect(readRecentSearches()).toEqual([]);
  });

  it("keeps the last 4 viewed products by slug", () => {
    for (const slug of ["a", "b", "c", "d", "a", "e"]) {
      addViewedProduct({ slug, name: slug.toUpperCase(), subtitle: null, imageUrl: null, lowestPrice: null, sellerCount: null });
    }
    expect(readViewedProducts().map((item) => item.slug)).toEqual(["e", "a", "d", "c"]);
  });
});
