import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { clearSession } from "@/lib/api/session";
import { createTestQueryClient } from "../utils";

describe("Auth Flow Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes full login flow and redirects to home", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: {
          user: { id: "1", email: "test@pegasus.com", roles: ["CUSTOMER"] },
          tokens: { accessToken: "valid-token", refreshToken: "refresh", expiresIn: 3600 }
        }
      })
    } as unknown as Response);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // 1. Fill out the form
    await user.type(screen.getByLabelText(/email/i), "test@pegasus.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // 2. Submit
    await user.click(screen.getByRole("button", { name: /log in/i }));

    // 3. Verify API was called correctly
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@pegasus.com", password: "password123" }),
        })
      );
    });

    // 4. Verify routing occurred
    expect(await screen.findByTestId("home-page")).toBeInTheDocument();
  });
});
