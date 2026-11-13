import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";

import * as catalogApi from "@/features/catalog/catalog.api";
import { SUGGEST_DEBOUNCE_MS, useSearchSuggest } from "@/features/catalog/catalog.queries";
import type { SearchSuggestDto } from "@/features/catalog/catalog.types";
import { createTestQueryClient } from "@/test/utils";

const result = (query: string): SearchSuggestDto => ({
  query,
  correctedQuery: null,
  correctionReason: null,
  completions: [`${query} ex`],
  scopes: [],
  products: [],
  shops: [],
  totalProducts: 1,
});

let client = createTestQueryClient();
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSearchSuggest [TCG-776]", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    client = createTestQueryClient();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not call the API for a blank query", async () => {
    const spy = vi.spyOn(catalogApi, "getSearchSuggest");
    renderHook(() => useSearchSuggest("   "), { wrapper });
    await act(() => vi.advanceTimersByTimeAsync(SUGGEST_DEBOUNCE_MS * 2));
    expect(spy).not.toHaveBeenCalled();
  });

  it("waits 150ms after typing stops and sends one request", async () => {
    const spy = vi.spyOn(catalogApi, "getSearchSuggest").mockImplementation(async (q) => result(q));
    const { result: hook, rerender } = renderHook(({ q }) => useSearchSuggest(q), {
      wrapper,
      initialProps: { q: "" },
    });
    rerender({ q: "c" });
    await act(() => vi.advanceTimersByTimeAsync(100));
    rerender({ q: "ch" });
    await act(() => vi.advanceTimersByTimeAsync(100));
    rerender({ q: "char" });
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(spy).not.toHaveBeenCalled();
    expect(hook.current.settled).toBe(false);

    await act(() => vi.advanceTimersByTimeAsync(SUGGEST_DEBOUNCE_MS + 10));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("char", expect.any(AbortSignal));
    await waitFor(() => expect(hook.current.data?.completions).toEqual(["char ex"]));
    expect(hook.current.settled).toBe(true);
  });

  it("aborts the request of an older term when the user keeps typing", async () => {
    const signals: AbortSignal[] = [];
    vi.spyOn(catalogApi, "getSearchSuggest").mockImplementation(
      (q, signal) =>
        new Promise((resolve) => {
          signals.push(signal!);
          if (q === "charizard") resolve(result(q));
        }),
    );
    const { result: hook, rerender } = renderHook(({ q }) => useSearchSuggest(q), {
      wrapper,
      initialProps: { q: "char" },
    });
    await act(() => vi.advanceTimersByTimeAsync(SUGGEST_DEBOUNCE_MS));
    expect(signals).toHaveLength(1);

    rerender({ q: "charizard" });
    await act(() => vi.advanceTimersByTimeAsync(SUGGEST_DEBOUNCE_MS + 10));
    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    await waitFor(() => expect(hook.current.data?.query).toBe("charizard"));
  });
});
