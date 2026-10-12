import { act, renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authApi from "@/features/auth/auth.api";
import { useLogin } from "@/features/auth/auth.queries";
import { cartApi } from "@/features/cart/cart.api";
import { clearCartSession, getCartSession, setCartSession } from "@/lib/api";
import { createTestQueryClient } from "@/test/utils";

describe("guest cart merge on login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearCartSession();
  });

  function setup() {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return { queryClient, wrapper };
  }

  const session = {
    tokens: { accessToken: "access", refreshToken: "refresh", expiresIn: 3600 },
    user: { id: 1, username: "buyer", email: "buyer@example.com", roles: ["BUYER"] },
  };

  it("merges the guest cart and clears the guest session after successful login", async () => {
    setCartSession("guest-session-id");
    vi.spyOn(authApi, "login").mockResolvedValue(session as never);
    const mergeCart = vi.spyOn(cartApi, "mergeCart").mockResolvedValue({ items: [] } as never);
    const { wrapper } = setup();
    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ email: "buyer@example.com", password: "password" });
    });

    expect(mergeCart).toHaveBeenCalledOnce();
    expect(getCartSession()).toBeNull();
  });

  it("keeps the guest session if merge fails so its cart is not orphaned", async () => {
    setCartSession("guest-session-id");
    vi.spyOn(authApi, "login").mockResolvedValue(session as never);
    vi.spyOn(cartApi, "mergeCart").mockRejectedValue(new Error("temporary failure"));
    const { wrapper } = setup();
    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ email: "buyer@example.com", password: "password" });
    });

    expect(getCartSession()).toBe("guest-session-id");
  });
});
