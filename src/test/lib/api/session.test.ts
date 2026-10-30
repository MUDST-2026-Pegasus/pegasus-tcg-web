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
    expect(await refreshAccessToken()).toBe("new");
    expect(fetch).toHaveBeenCalledWith("http://mock/auth/refresh", expect.objectContaining({
      credentials: "include", body: "{}", method: "POST",
    }));
    expect(getAccessToken()).toBe("new");
  });

  it("clears memory when refresh is rejected", async () => {
    saveSession({ accessToken: "old", expiresIn: -1 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 401 } as Response);
    expect(await refreshAccessToken()).toBeNull();
    expect(getSession()).toBeNull();
  });

  it("keeps the current session when refresh gets a temporary server error", async () => {
    saveSession({ accessToken: "old", expiresIn: -1 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 503 } as Response);
    expect(await refreshAccessToken()).toBeNull();
    expect(getAccessToken()).toBe("old");
  });

  it("does not let a late refresh overwrite a newer login", async () => {
    let finish!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise<Response>((resolve) => {
      finish = resolve;
    }));
    const pending = refreshAccessToken();
    saveSession({ accessToken: "new-login", expiresIn: 900 });
    finish({
      ok: true,
      json: async () => ({ success: true, data: { tokens: { accessToken: "stale", expiresIn: 900 } } }),
    } as Response);
    await pending;
    expect(getAccessToken()).toBe("new-login");
  });

  it("refreshes another tab on login but ignores ordinary refresh broadcasts", async () => {
    const channels: Array<{ onmessage: ((event: MessageEvent) => void) | null }> = [];
    class FakeChannel {
      onmessage: ((event: MessageEvent) => void) | null = null;
      constructor() { channels.push(this); }
      postMessage() { /* No other tab in this test. */ }
    }
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    vi.resetModules();
    const otherTab = await import("@/lib/api/session");
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { tokens: { accessToken: "new", expiresIn: 900 } } }),
    } as Response);

    channels[0].onmessage?.({ data: "refreshed" } as MessageEvent);
    expect(fetch).not.toHaveBeenCalled();
    channels[0].onmessage?.({ data: "login" } as MessageEvent);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(otherTab.getAccessToken()).toBe("new"));
    vi.unstubAllGlobals();
  });
});
