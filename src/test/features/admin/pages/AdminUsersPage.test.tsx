import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import * as usersApi from "@/features/admin/users.api";
import type { AdminUser } from "@/features/admin/users.types";
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import type { PageResponse } from "@/lib/api";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/admin/users.api", () => ({
  getAdminUsers: vi.fn(),
  updateUserStatus: vi.fn(),
  changeUserRole: vi.fn(),
}));

vi.mock("@/features/auth/auth.queries", () => ({
  useAuth: () => ({
    user: {
      id: 99,
      email: "admin@pegasus.com",
      username: "superadmin",
      displayName: "Super Admin",
      roles: ["ADMIN"],
    },
    isAuthenticated: true,
  }),
}));

const mockUsers: AdminUser[] = [
  {
    id: 1,
    email: "somchai@test.com",
    username: "somchai_s",
    displayName: "Somchai S",
    bio: null,
    phone: "0812345678",
    phonePublic: true,
    avatarUrl: null,
    status: "ACTIVE",
    roles: ["BUYER", "SELLER"],
    createdAt: "2026-01-10T10:00:00Z",
    lastLoginAt: "2026-10-15T08:00:00Z",
  },
  {
    id: 2,
    email: "manee@test.com",
    username: "manee_m",
    displayName: "Manee M",
    bio: null,
    phone: null,
    phonePublic: false,
    avatarUrl: null,
    status: "SUSPENDED",
    roles: ["BUYER"],
    createdAt: "2026-02-15T10:00:00Z",
    lastLoginAt: null,
  },
];

function mockPage(items: AdminUser[]): PageResponse<AdminUser> {
  return {
    items,
    page: 0,
    size: 20,
    totalItems: items.length,
    totalPages: 1,
  };
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title, user counts, and user list table", async () => {
    vi.mocked(usersApi.getAdminUsers).mockResolvedValue(mockPage(mockUsers));

    renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

    // Header
    expect(screen.getByText("จัดการผู้ใช้")).toBeInTheDocument();

    // Table rows
    expect(await screen.findByText("@somchai_s")).toBeInTheDocument();
    expect(screen.getByText("somchai@test.com")).toBeInTheDocument();
    expect(screen.getByText("@manee_m")).toBeInTheDocument();
    expect(screen.getByText("manee@test.com")).toBeInTheDocument();

    // Status badges
    expect(screen.getByText("ใช้งานปกติ")).toBeInTheDocument();
    expect(screen.getByText("ถูกระงับ")).toBeInTheDocument();
  });

  it("renders error state when user query fails", async () => {
    vi.mocked(usersApi.getAdminUsers).mockRejectedValue(new Error("Network Error"));

    renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

    expect(await screen.findByText("โหลดรายชื่อผู้ใช้ไม่สำเร็จ")).toBeInTheDocument();
  });
});
