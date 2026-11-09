import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/api/client";
import { CLIENT_ERROR_CODES } from "@/lib/api/types";
import * as session from "@/lib/api/session";
import * as cartSession from "@/lib/api/cart-session";

vi.mock("@/lib/api/session", () => ({
  bootstrapSession: vi.fn(),
  getAccessToken: vi.fn(),
  isAccessTokenExpired: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

vi.mock("@/lib/api/cart-session", () => ({
  getCartSession: vi.fn(),
  getOrCreateCartSession: vi.fn(),
  setCartSession: vi.fn(),
}));

vi.mock("@/lib/api/config", () => ({
  buildUrl: vi.fn((path) => `http://mock${path}`),
}));

describe("api client", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    vi.clearAllMocks();
    vi.mocked(session.bootstrapSession).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createResponse = (
    ok: boolean,
    status: number,
    body: unknown,
    headers: HeadersInit = {},
  ) => ({
    ok,
    status,
    headers: new Headers(headers),
    text: async () => (body === null ? "" : JSON.stringify(body)),
    blob: async () => body instanceof Blob ? body : new Blob(),
  });

  it("should perform GET request and unwrap success response", async () => {
    vi.mocked(session.isAccessTokenExpired).mockReturnValue(false);
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 200, { success: true, data: { user: "john" } })
    );

    const result = await api.get("/users");
    
    expect(mockFetch).toHaveBeenCalledWith("http://mock/users", expect.objectContaining({
      method: "GET",
      headers: { Accept: "application/json", "Accept-Language": "th" },
    }));
    expect(result).toEqual({ user: "john" });
  });

  it("sends the current UI language as Accept-Language", async () => {
    vi.mocked(session.isAccessTokenExpired).mockReturnValue(false);
    mockFetch.mockResolvedValueOnce(createResponse(true, 200, { success: true, data: null }));
    document.documentElement.lang = "en";
    try {
      await api.get("/users");
    } finally {
      document.documentElement.lang = "th";
    }
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock/users",
      expect.objectContaining({ headers: expect.objectContaining({ "Accept-Language": "en" }) }),
    );
  });

  it("waits for session bootstrap before an authenticated request", async () => {
    let completeBootstrap!: () => void;
    vi.mocked(session.bootstrapSession).mockReturnValue(new Promise<void>((resolve) => {
      completeBootstrap = resolve;
    }));
    vi.mocked(session.getAccessToken).mockReturnValue("restored-token");
    mockFetch.mockResolvedValueOnce(createResponse(true, 200, { success: true, data: "ok" }));

    const result = api.get("/cart");
    expect(mockFetch).not.toHaveBeenCalled();
    completeBootstrap();
    await result;
    expect(mockFetch).toHaveBeenCalledWith("http://mock/cart", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer restored-token" }),
    }));
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
          "Accept-Language": "th",
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
        headers: { Accept: "application/json", "Accept-Language": "th" }, // No Authorization
      })
    );
  });

  it("attaches the generated guest cart session to cart writes", async () => {
    vi.mocked(session.isAccessTokenExpired).mockReturnValue(false);
    vi.mocked(session.getAccessToken).mockReturnValue(null);
    vi.mocked(cartSession.getCartSession).mockReturnValue(null);
    vi.mocked(cartSession.getOrCreateCartSession).mockReturnValue("guest-session-id");
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 201, { success: true, data: { id: 7 } }),
    );

    await api.post("/cart/items", { listingId: 12, quantity: 1 });

    expect(cartSession.getOrCreateCartSession).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock/cart/items",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Cart-Session": "guest-session-id" }),
      }),
    );
  });

  it("keeps the guest session header on authenticated cart merge", async () => {
    vi.mocked(session.isAccessTokenExpired).mockReturnValue(false);
    vi.mocked(session.getAccessToken).mockReturnValue("user-token");
    vi.mocked(cartSession.getCartSession).mockReturnValue("guest-session-id");
    mockFetch.mockResolvedValueOnce(
      createResponse(true, 200, { success: true, data: { items: [] } }),
    );

    await api.post("/cart/merge");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock/cart/merge",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer user-token",
          "X-Cart-Session": "guest-session-id",
        }),
      }),
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

  it("downloads a PDF with authentication and preserves its response metadata", async () => {
    vi.mocked(session.getAccessToken).mockReturnValue("seller-token");
    const pdf = new Blob(["%PDF-test"], { type: "application/pdf" });
    mockFetch.mockResolvedValueOnce(createResponse(true, 200, pdf, {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename*=UTF-8''order-summary-PGS-101.pdf",
    }));

    const result = await api.download("/sellers/me/orders/41/summary.pdf");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock/sellers/me/orders/41/summary.pdf",
      expect.objectContaining({
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: "Bearer seller-token",
        },
      }),
    );
    expect(result).toEqual({
      blob: pdf,
      filename: "order-summary-PGS-101.pdf",
    });
    expect(result.blob.type).toBe("application/pdf");
  });

  it("keeps structured API errors for failed PDF downloads", async () => {
    mockFetch.mockResolvedValueOnce(createResponse(false, 404, {
      success: false,
      message: "Order not found",
      data: { code: "ORDER_NOT_FOUND" },
    }, { "Content-Type": "application/json" }));

    await expect(api.download("/sellers/me/orders/999/summary.pdf")).rejects.toMatchObject({
      status: 404,
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
    });
  });

  it("preserves seller details so checkout can identify the changed shipping option", async () => {
    mockFetch.mockResolvedValueOnce(createResponse(false, 400, {
      success: false, message: "Shipping option is inactive",
      data: { code: "SHIPPING_OPTION_INVALID", details: { sellerProfileId: 2, shippingOptionId: 21 } },
    }));
    await expect(api.post("/checkout", {})).rejects.toMatchObject({
      status: 400, code: "SHIPPING_OPTION_INVALID", details: { sellerProfileId: 2, shippingOptionId: 21 },
    });
  });
});
