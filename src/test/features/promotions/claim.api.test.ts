import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import { claimApi } from "@/features/promotions/claim.api";

afterEach(() => vi.restoreAllMocks());

describe("claimApi requests", () => {
  it("loads featured, shop, and terms resources with encoded path values", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue([] as never);

    await claimApi.featured();
    await claimApi.storeCodes("shop/name");
    await claimApi.terms("A B");

    expect(get).toHaveBeenNthCalledWith(1, "/promotions/featured");
    expect(get).toHaveBeenNthCalledWith(2, "/u/shop%2Fname/promotions");
    expect(get).toHaveBeenNthCalledWith(3, "/promotions/A%20B/terms");
  });

  it("posts optional claim source, typed code, and wallet filters", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({} as never);
    const get = vi.spyOn(api, "get").mockResolvedValue({} as never);

    await claimApi.claim(10);
    await claimApi.claim(11, "CART");
    await claimApi.claimByCode("SAVE10");
    await claimApi.wallet("AVAILABLE", "SELLER");

    expect(post).toHaveBeenNthCalledWith(1, "/promotions/10/claim", {});
    expect(post).toHaveBeenNthCalledWith(2, "/promotions/11/claim", { source: "CART" });
    expect(post).toHaveBeenNthCalledWith(3, "/me/promotions/claim-by-code", { code: "SAVE10" });
    expect(get).toHaveBeenCalledWith("/me/promotions", { query: { tab: "AVAILABLE", owner: "SELLER" } });
  });
});
