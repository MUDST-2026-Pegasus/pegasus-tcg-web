import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/utils";
import { useCheckoutSubmit, type CheckoutPayload } from "@/features/cart/useCheckoutSubmit";
import { checkoutApi } from "@/features/cart/checkout.api";
import { cartKeys } from "@/features/cart/cart.queries";
import { PROMOTION_SELECTION_KEY } from "@/features/cart/promotions.storage";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import type { CheckoutResponse } from "@/features/cart/checkout.types";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const payload: CheckoutPayload = {
  cartItemIds: [42],
  shippingAddressId: 1,
  shippingOptionBySeller: { 1: 11 },
  platformCode: null,
  sellerCodes: {},
  expectedGrandTotal: 340,
};
const orderResponse: CheckoutResponse = { orderId: 1001, orderNumber: "ORD-1001", buyerId: 10, status: "PENDING_PAYMENT", currency: "THB", itemsSubtotal: 300, shippingTotal: 40, discountTotal: 0, grandTotal: 340, placedAt: "2026-01-01T00:00:00Z", sellerOrders: [], replayed: false };

function setup(options: { canPurchase?: boolean; buildPayload?: () => CheckoutPayload } = {}) {
  const queryClient = createTestQueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const completedRef = { current: false };
  const onError = vi.fn(async () => {});
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  const hook = renderHook(
    () => useCheckoutSubmit({
      canPurchase: options.canPurchase ?? true,
      buildPayload: options.buildPayload ?? (() => payload),
      completedRef,
      onError,
    }),
    { wrapper },
  );
  return { hook, completedRef, onError, invalidate };
}

/** Idempotency-Key sent with each checkout call. */
const keys = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.map((call) => call[1]);

describe("useCheckoutSubmit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());
  });

  it("does nothing when the order is not ready", async () => {
    const submit = vi.spyOn(checkoutApi, "checkout");
    const { hook } = setup({ canPurchase: false });
    await act(() => hook.result.current.submit());
    expect(submit).not.toHaveBeenCalled();
  });

  it("sends one request when submit is called twice while the first is in flight", async () => {
    let resolve!: (value: CheckoutResponse) => void;
    const submit = vi.spyOn(checkoutApi, "checkout").mockReturnValue(new Promise((res) => { resolve = res; }));
    const { hook } = setup();
    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = hook.result.current.submit();
      second = hook.result.current.submit();
    });
    expect(hook.result.current.isSubmitting).toBe(true);
    await act(async () => {
      resolve(orderResponse);
      await Promise.all([first, second]);
    });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isSubmitting).toBe(false);
  });

  it("places the order, marks it completed and goes to payment", async () => {
    sessionStorage.setItem(PROMOTION_SELECTION_KEY, JSON.stringify({ platformCode: "X", sellerCodes: {} }));
    const submit = vi.spyOn(checkoutApi, "checkout").mockResolvedValue(orderResponse);
    const { hook, completedRef, onError, invalidate } = setup();
    await act(() => hook.result.current.submit());
    expect(submit).toHaveBeenCalledWith(payload, expect.stringMatching(/^[0-9a-f-]{36}$/i));
    expect(completedRef.current).toBe(true);
    expect(sessionStorage.getItem(PROMOTION_SELECTION_KEY)).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/payment?orderId=1001", { state: { orderId: 1001, order: orderResponse } });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: cartKeys.all });
    expect(onError).not.toHaveBeenCalled();
  });

  it.each([
    ["a network failure", new ApiError({ status: 0, code: "NETWORK_ERROR", message: "offline" })],
    ["a 5xx answer", new ApiError({ status: 503, code: "UNAVAILABLE", message: "down" })],
    ["a non-API error", new Error("boom")],
  ])("reuses the idempotency key for the same order after %s", async (_label, error) => {
    const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValueOnce(error).mockResolvedValue(orderResponse);
    const { hook, onError, completedRef } = setup();
    await act(() => hook.result.current.submit());
    expect(onError).toHaveBeenCalledWith(error, payload);
    expect(completedRef.current).toBe(false);
    await act(() => hook.result.current.submit());
    expect(submit).toHaveBeenCalledTimes(2);
    expect(keys(submit)[1]).toBe(keys(submit)[0]);
  });

  it("starts a new idempotency key after a 4xx answer", async () => {
    const error = new ApiError({ status: 409, code: "INSUFFICIENT_STOCK", message: "Out of stock" });
    const submit = vi.spyOn(checkoutApi, "checkout").mockRejectedValueOnce(error).mockResolvedValue(orderResponse);
    const { hook, onError } = setup();
    await act(() => hook.result.current.submit());
    expect(onError).toHaveBeenCalledWith(error, payload);
    await act(() => hook.result.current.submit());
    expect(keys(submit)[1]).not.toBe(keys(submit)[0]);
  });

  it("starts a new idempotency key when the order changes", async () => {
    let current = payload;
    const submit = vi.spyOn(checkoutApi, "checkout")
      .mockRejectedValueOnce(new ApiError({ status: 0, code: "NETWORK_ERROR", message: "offline" }))
      .mockResolvedValue(orderResponse);
    const { hook } = setup({ buildPayload: () => current });
    await act(() => hook.result.current.submit());
    current = { ...payload, shippingOptionBySeller: { 1: 12 } };
    await act(() => hook.result.current.submit());
    expect(submit.mock.calls[1][0]).toEqual(current);
    expect(keys(submit)[1]).not.toBe(keys(submit)[0]);
  });
});
