import { describe, expect, it } from "vitest";

import { toSidebarUser } from "@/features/account/account.format";
import type { AuthUser } from "@/features/auth/auth.types";

function user(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 13,
    email: "ash@example.com",
    username: "ash",
    displayName: "Ash Ketchum",
    bio: null,
    phone: null,
    avatarUrl: null,
    status: "ACTIVE",
    roles: ["BUYER"],
    createdAt: "2026-01-01T00:00:00Z",
    lastLoginAt: null,
    ...overrides,
  };
}

describe("toSidebarUser", () => {
  it("passes the avatar on so the sidebar shows the same picture as the profile card", () => {
    const avatarUrl = "https://example.com/avatars/ash.png";

    expect(toSidebarUser(user({ avatarUrl }))).toEqual({
      initials: "AK",
      name: "Ash Ketchum",
      email: "ash@example.com",
      avatarUrl,
    });
  });

  it("leaves the avatar empty for a user without one, so the initials show", () => {
    expect(toSidebarUser(user()).avatarUrl).toBeNull();
  });

  it("falls back to a placeholder when nobody is signed in", () => {
    expect(toSidebarUser(null)).toEqual({ initials: "?", name: "", email: "", avatarUrl: null });
  });
});
