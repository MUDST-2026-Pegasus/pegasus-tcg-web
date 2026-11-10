import { describe, expect, it, vi } from "vitest";

import { fetchAllPages, MAX_PAGE_SIZE, type PageResponse } from "@/lib/api";

function page<T>(items: T[], pageNo: number, totalPages: number): PageResponse<T> {
  return { items, page: pageNo, size: MAX_PAGE_SIZE, totalItems: 0, totalPages };
}

describe("fetchAllPages", () => {
  it("walks every page at the maximum size and keeps the order", async () => {
    const fetchPage = vi.fn(async (pageNo: number) => page([`a${pageNo}`, `b${pageNo}`], pageNo, 3));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual(["a0", "b0", "a1", "b1", "a2", "b2"]);
    expect(fetchPage.mock.calls).toEqual([
      [0, 100],
      [1, 100],
      [2, 100],
    ]);
  });

  it("stops after the first page when there is only one or none", async () => {
    const fetchPage = vi.fn(async () => page<string>([], 0, 0));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual([]);
    expect(fetchPage).toHaveBeenCalledOnce();
  });

  it("fails as a whole when any page fails", async () => {
    const fetchPage = vi.fn(async (pageNo: number) => {
      if (pageNo === 1) throw new Error("boom");
      return page([pageNo], pageNo, 3);
    });

    await expect(fetchAllPages(fetchPage)).rejects.toThrow("boom");
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
