import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/utils";
import { useShippingQuotes } from "@/features/cart/cart.queries";
import { checkoutApi } from "@/features/cart/checkout.api";
import type { CartItemResponse } from "@/features/cart/cart.types";
import type { ShippingQuote } from "@/features/cart/checkout.types";

describe("useShippingQuotes", () => {
  it("keeps previous quotes during a quantity refresh and isolates cart selection", async () => {
    const initial: ShippingQuote[] = [{ sellerProfileId: 1, sellerName: "Demo", itemCount: 1, itemsSubtotal: 100, defaultOptionId: null, options: [] }];
    let resolveNext!: (value: ShippingQuote[]) => void;
    const next = new Promise<ShippingQuote[]>(resolve => { resolveNext = resolve; });
    const spy = vi.spyOn(checkoutApi, "getShippingQuotes").mockResolvedValueOnce(initial).mockReturnValueOnce(next).mockResolvedValueOnce(initial);
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, rerender } = renderHook(({ quantity, ids }) => useShippingQuotes(ids, { userId: 1, cartId: 1, items: [{ id: 42, quantity, currentPrice: 100, unitPriceAtAdd: 100 } as CartItemResponse] }), { wrapper, initialProps: { quantity: 1, ids: [42] } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ quantity: 2, ids: [42] });
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    expect(result.current.data).toEqual(initial);
    expect(result.current.isPlaceholderData).toBe(true);
    await act(async () => resolveNext([{ ...initial[0], itemCount: 2, itemsSubtotal: 200 }]));
    await waitFor(() => expect(result.current.data?.[0].itemCount).toBe(2));
    rerender({ quantity: 2, ids: [42, 45] });
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(3));
    expect(spy).toHaveBeenLastCalledWith([42, 45]);
    spy.mockRestore();
  });
});
