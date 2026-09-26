import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { EditProfileDialog } from "@/features/account/components/EditProfileDialog";
import { createTestQueryClient } from "../utils";
import type { RoleCode } from "@/features/auth/auth.types";

describe("Profile Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates profile information and closes dialog on success", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: {
          id: "1",
          email: "test@pegasus.com",
          roles: ["BUYER"],
          displayName: "New Master",
          phone: "0891234567",
        }
      })
    } as unknown as Response);

    const onOpenChange = vi.fn();

    const mockUser = {
      id: 1,
      email: "test@pegasus.com",
      roles: ["BUYER" as RoleCode],
      displayName: "Old Master",
      createdAt: "2026-01-01T00:00:00Z",
      username: "old_master",
      bio: null,
      phone: null,
      avatarUrl: null,
      status: "ACTIVE" as const,
      lastLoginAt: null
    };

    render(
      <QueryClientProvider client={queryClient}>
        <EditProfileDialog open={true} onOpenChange={onOpenChange} user={mockUser} />
      </QueryClientProvider>
    );

    // Wait for dialog to open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByLabelText(/display name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New Master");
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, "0891234567");

    // Submit form
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    // Verify API called
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ displayName: "New Master", phone: "0891234567", bio: null, avatarUrl: null }),
        })
      );
    });

    // Verify dialog was requested to close
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
