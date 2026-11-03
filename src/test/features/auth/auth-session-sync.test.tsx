import { act, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuthSessionSync } from "@/features/auth/auth.queries";
import { clearSession, saveSession } from "@/lib/api";
import { bootstrapSession } from "@/lib/api/session";
import { createTestQueryClient } from "@/test/utils";

describe("useAuthSessionSync", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession(false);
  });

  function setup() {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["games"], [{ id: 1 }]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    renderHook(() => useAuthSessionSync(), { wrapper });
    return queryClient;
  }

  it("keeps public queries when a guest finishes bootstrapping", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const queryClient = setup();

    await act(async () => {
      await bootstrapSession();
    });

    expect(queryClient.getQueryData(["games"])).toEqual([{ id: 1 }]);
  });

  it("clears the cache when a signed-in session ends", () => {
    saveSession({ accessToken: "access", expiresIn: 3600 }, false);
    const queryClient = setup();

    act(() => clearSession(false));

    expect(queryClient.getQueryData(["games"])).toBeUndefined();
  });
});
