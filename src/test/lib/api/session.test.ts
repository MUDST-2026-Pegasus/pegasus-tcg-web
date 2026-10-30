import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSession, saveSession, clearSession, getAccessToken,
  isAccessTokenExpired, refreshAccessToken,
} from "@/lib/api/session";

vi.mock("@/lib/api/config", () => ({ buildUrl: (path: string) => `http://mock${path}` }));

describe("api session", () => {
  beforeEach(() => {
    clearSession(false);
    vi.restoreAllMocks();
  });

  it("keeps only the access token in memory", () => {
    saveSession({ accessToken: "access", expiresIn: 3600 });
    expect(getAccessToken()).toBe("access");
    expect(getSession()).toEqual({ accessToken: "access", accessExpiresAt: expect.any(Number) });
    expect(window.localStorage.getItem("pegasus.auth.session")).toBeNull();
    clearSession(false);
    expect(getSession()).toBeNull();
  });

  it("recognizes an access token near expiry", () => {
    saveSession({ accessToken: "access", expiresIn: 10 });
    expect(isAccessTokenExpired()).toBe(true);
    saveSession({ accessToken: "access", expiresIn: 100 });
    expect(isAccessTokenExpired()).toBe(false);
  });

  it("refreshes with a cookie and no token in the body", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { tokens: { accessToken: "new", expiresIn: 900 } } }),
    } as Response);
    expect(await refreshAccessToken(false)).toBe("new");
    expect(fetch).toHaveBeenCalledWith("http://mock/auth/refresh", expect.objectContaining({
      credentials: "include", body: "{}", method: "POST",
    }));
    expect(getAccessToken()).toBe("new");
  });

  it("clears memory when refresh is rejected", async () => {
    saveSession({ accessToken: "old", expiresIn: -1 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false } as Response);
    expect(await refreshAccessToken(false)).toBeNull();
    expect(getSession()).toBeNull();
  });
});
