import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/api/client";
import { CLIENT_ERROR_CODES } from "@/lib/api/types";
import * as session from "@/lib/api/session";

vi.mock("@/lib/api/session", () => ({
  getAccessToken: vi.fn(),
  isAccessTokenExpired: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

vi.mock("@/lib/api/config", () => ({
  buildUrl: vi.fn((path) => `http://mock${path}`),
}));

describe("api client", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createResponse = (ok: boolean, status: number, body: unknown) => ({
    ok,
    status,
    text: async () => (body === null ? "" : JSON.stringify(body)),
  });

  it("should perform GET request and unwrap success response", async () => {
    vi.mocked(session.isAccessTokenExpired).mockReturnValue(false);
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 200, { success: true, data: { user: "john" } })
    );

    const result = await api.get("/users");
    
    expect(mockFetch).toHaveBeenCalledWith("http://mock/users", expect.objectContaining({
      method: "GET",
      headers: { Accept: "application/json" },
    }));
    expect(result).toEqual({ user: "john" });
  });

  it("should add Authorization header if auth is true and token exists", async () => {
    vi.mocked(session.isAccessTokenExpired).mockReturnValue(false);
    vi.mocked(session.getAccessToken).mockReturnValue("fake-token");
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 200, { success: true, data: "ok" })
    );

    await api.get("/auth-route", { auth: true });
    
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock/auth-route",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer fake-token",
        },
      })
    );
  });

  it("should not add Authorization header if auth is false", async () => {
    vi.mocked(session.getAccessToken).mockReturnValue("fake-token");
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 200, { success: true, data: "ok" })
    );

    await api.get("/public", { auth: false });
    
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock/public",
      expect.objectContaining({
        headers: { Accept: "application/json" }, // No Authorization
      })
    );
  });

  it("should refresh token if expired before request", async () => {
    vi.mocked(session.isAccessTokenExpired).mockReturnValue(true);
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 200, { success: true, data: "ok" })
    );

    await api.get("/protected");
    
    expect(session.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should handle 401 retry", async () => {
    vi.mocked(session.isAccessTokenExpired).mockReturnValue(false);
    vi.mocked(session.getAccessToken).mockReturnValue("old-token");
    
    // First request returns 401
    mockFetch.mockResolvedValueOnce(
      createResponse(false, 401, { success: false, message: "Unauthorized" })
    );
    // Refresh successful
    vi.mocked(session.refreshAccessToken).mockResolvedValue("new-token");
    // Second request returns 200
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 200, { success: true, data: "ok2" })
    );

    const result = await api.get("/protected");
    
    expect(session.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toBe("ok2");
  });

  it("should handle POST with body", async () => {
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 200, { success: true, data: "created" })
    );

    const bodyData = { title: "Hello" };
    await api.post("/posts", bodyData);
    
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock/posts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(bodyData),
      })
    );
  });

  it("should throw ApiError on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network disconnect"));

    await expect(api.get("/fail")).rejects.toMatchObject({
      code: CLIENT_ERROR_CODES.NETWORK_ERROR,
    });
  });

  it("should throw ApiError on abort error", async () => {
    mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(api.get("/fail")).rejects.toMatchObject({
      code: CLIENT_ERROR_CODES.ABORTED,
    });
  });

  it("should parse api error body when not successful", async () => {
    mockFetch.mockResolvedValueOnce(
      createResponse(false, 400, {
        success: false,
        message: "Bad request",
        data: {
          code: "VALIDATION_FAILED",
          violations: [{ field: "name", message: "Required" }],
          path: "/fail"
        }
      })
    );

    await expect(api.get("/fail")).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_FAILED",
      message: "Bad request",
      violations: [{ field: "name", message: "Required" }],
    });
  });
});
