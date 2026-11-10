import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAllAdminAuctions, getAllBannedBidders } from "@/features/auction/auction.api";
import { api } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { ...actual.api, get: vi.fn() } };
});

type Query = { page: number; size: number; tab?: string; q?: string };

/** 3 หน้า หน้าละ 2 แถว — แถวบอกว่ามาจากหน้าไหน */
function pagedResponse(_path: string, options?: { query?: Record<string, unknown> }) {
  const query = (options?.query ?? { page: 0, size: 100 }) as Query;
  return Promise.resolve({
    page: {
      items: [{ id: `${query.page}-a` }, { id: `${query.page}-b` }],
      page: query.page,
      size: query.size,
      totalItems: 6,
      totalPages: 3,
    },
  });
}

describe("admin auction exports fetch every page [TCG-749]", () => {
  beforeEach(() => vi.mocked(api.get).mockReset());

  it("auctions: walks all pages of the current tab and search at size 100", async () => {
    vi.mocked(api.get).mockImplementation(pagedResponse as typeof api.get);

    const rows = await getAllAdminAuctions({ tab: "LIVE", q: "pika" });

    expect(rows.map((row) => (row as unknown as { id: string }).id)).toEqual(["0-a", "0-b", "1-a", "1-b", "2-a", "2-b"]);
    expect(vi.mocked(api.get).mock.calls.map(([path, options]) => [path, options?.query])).toEqual([
      ["/admin/auctions", { tab: "LIVE", q: "pika", page: 0, size: 100 }],
      ["/admin/auctions", { tab: "LIVE", q: "pika", page: 1, size: 100 }],
      ["/admin/auctions", { tab: "LIVE", q: "pika", page: 2, size: 100 }],
    ]);
  });

  it("banned bidders: walks all pages of the current tab and search", async () => {
    vi.mocked(api.get).mockImplementation(pagedResponse as typeof api.get);

    const rows = await getAllBannedBidders({ tab: "AT_RISK", q: "ton" });

    expect(rows).toHaveLength(6);
    expect(vi.mocked(api.get).mock.calls.map(([path, options]) => [path, options?.query])).toEqual([
      ["/admin/auctions/banned-bidders", { tab: "AT_RISK", q: "ton", page: 0, size: 100 }],
      ["/admin/auctions/banned-bidders", { tab: "AT_RISK", q: "ton", page: 1, size: 100 }],
      ["/admin/auctions/banned-bidders", { tab: "AT_RISK", q: "ton", page: 2, size: 100 }],
    ]);
  });

  it("rejects when a later page fails, so no partial file is built", async () => {
    vi.mocked(api.get).mockImplementation(((path: string, options?: { query?: Record<string, unknown> }) =>
      (options?.query as Query | undefined)?.page === 2 ? Promise.reject(new Error("network")) : pagedResponse(path, options)) as typeof api.get);

    await expect(getAllBannedBidders({ tab: "BANNED" })).rejects.toThrow("network");
  });
});
