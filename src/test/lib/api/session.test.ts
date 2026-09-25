import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSession,
  saveSession,
  clearSession,
  subscribeSession,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  refreshAccessToken,
} from "@/lib/api/session";

// Mock the localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

vi.mock("@/lib/api/config", () => ({
  buildUrl: vi.fn((path) => `http://mock${path}`),
}));

globalThis.fetch = vi.fn();

describe("api session", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should save and get session", () => {
    const tokens = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
      expiresIn: 3600,
    };

    saveSession(tokens);

    const session = getSession();
    expect(session).toBeDefined();
    expect(session?.accessToken).toBe("access-token-123");
    expect(session?.refreshToken).toBe("refresh-token-456");
    expect(session?.accessExpiresAt).toBeGreaterThan(Date.now());
    
    expect(getAccessToken()).toBe("access-token-123");
    expect(getRefreshToken()).toBe("refresh-token-456");
  });

  it("should clear session", () => {
    const tokens = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
      expiresIn: 3600,
    };

    saveSession(tokens);
    clearSession();

    expect(getSession()).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("should check if access token is expired", () => {
    vi.spyOn(Date, "now").mockReturnValue(10000000);

    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 10, // expires at 10010000
    });

    expect(isAccessTokenExpired()).toBe(true); // because 10s is less than 30s skew
    
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 100, // expires at 10100000
    });

    expect(isAccessTokenExpired()).toBe(false); 
  });

  it("should subscribe to session changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSession(listener);

    saveSession({
      accessToken: "token1",
      refreshToken: "token2",
      expiresIn: 3600,
    });

    expect(listener).toHaveBeenCalledTimes(1);

    clearSession();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    clearSession();
    expect(listener).toHaveBeenCalledTimes(2); // no more calls
  });

  it("should refresh access token", async () => {
    saveSession({
      accessToken: "old-access",
      refreshToken: "valid-refresh",
      expiresIn: -10, // expired
    });

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          tokens: {
            accessToken: "new-access",
            refreshToken: "new-refresh",
            expiresIn: 3600,
          },
        },
      }),
    } as unknown as Response);

    const token = await refreshAccessToken();
    
    expect(token).toBe("new-access");
    expect(globalThis.fetch).toHaveBeenCalledWith("http://mock/auth/refresh", expect.any(Object));
    expect(getAccessToken()).toBe("new-access");
    expect(getRefreshToken()).toBe("new-refresh");
  });

  it("should clear session on refresh fail", async () => {
    saveSession({
      accessToken: "old-access",
      refreshToken: "invalid-refresh",
      expiresIn: -10,
    });

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
    } as unknown as Response);

    const token = await refreshAccessToken();
    
    expect(token).toBeNull();
    expect(getSession()).toBeNull();
  });
});
