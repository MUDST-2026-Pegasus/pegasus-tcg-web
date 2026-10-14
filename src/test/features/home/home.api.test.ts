import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicProfile } from "@/features/home/home.api";
import { api, ApiError } from "@/lib/api";

afterEach(() => vi.restoreAllMocks());

describe("getPublicProfile", () => {
  it("uses the public profile endpoint when available", async () => {
    const profile = { username: "cardvault", displayName: "CardVault BKK", avatarUrl: "/avatar.jpg" };
    const get = vi.spyOn(api, "get").mockResolvedValueOnce(profile);

    await expect(getPublicProfile("cardvault")).resolves.toEqual(profile);
    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith("/u/cardvault", { auth: false, signal: undefined });
  });

  it("keeps the storefront working against an older API without the profile endpoint", async () => {
    const seller = { username: "cardvault", displayName: "CardVault BKK", avatarUrl: null };
    const get = vi.spyOn(api, "get")
      .mockRejectedValueOnce(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Unauthorized" }))
      .mockResolvedValueOnce({ items: [{ seller }] });

    await expect(getPublicProfile("cardvault")).resolves.toEqual(seller);
    expect(get).toHaveBeenNthCalledWith(2, "/u/cardvault/listings", {
      auth: false, signal: undefined, query: { sort: "newest", size: 1, page: 0 },
    });
  });
});
