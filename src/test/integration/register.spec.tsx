import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { clearSession } from "@/lib/api/session";
import { createTestQueryClient } from "../utils";

describe("Register Flow Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes full register flow and redirects to home", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: {
          user: { id: "2", username: "new_player", email: "new@pegasus.com", roles: ["CUSTOMER"] },
          tokens: { accessToken: "valid-token", refreshToken: "refresh", expiresIn: 3600 }
        }
      })
    } as unknown as Response);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill out the form
    await user.type(screen.getByLabelText(/username/i), "new_player");
    await user.type(screen.getByLabelText(/display name/i), "New Player");
    await user.type(screen.getByLabelText(/email/i), "new@pegasus.com");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("checkbox"));

    // Submit
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    // Verify API was called correctly
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/auth/register"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            username: "new_player",
            displayName: "New Player",
            email: "new@pegasus.com",
            password: "password123"
          }),
        })
      );
    });

    // Verify routing occurred
    expect(await screen.findByTestId("home-page")).toBeInTheDocument();
  });
});
