import { beforeEach, describe, expect, it, vi } from "vitest";

import * as usersApi from "@/features/admin/users.api";
import type { AdminUser } from "@/features/admin/users.types";
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import { ApiError, type PageResponse } from "@/lib/api";
import { renderWithProviders, screen, userEvent, waitFor, within } from "@/test/utils";

vi.mock("@/features/admin/users.api", () => ({
  getAdminUsers: vi.fn(),
  getAdminUser: vi.fn(),
  updateUserStatus: vi.fn(),
  grantRole: vi.fn(),
  revokeRole: vi.fn(),
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

const somchai: AdminUser = {
  id: 1,
  email: "somchai@test.com",
  username: "somchai_s",
  displayName: "Somchai S",
  bio: "ขายการ์ดโปเกมอนมือหนึ่ง",
  phone: "0812345678",
  phonePublic: true,
  avatarUrl: null,
  status: "ACTIVE",
  roles: ["BUYER", "SELLER"],
  createdAt: "2026-01-10T10:00:00Z",
  lastLoginAt: "2026-10-15T08:00:00Z",
};

const manee: AdminUser = {
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
};

const me: AdminUser = {
  id: 99,
  email: "admin@pegasus.com",
  username: "superadmin",
  displayName: "Super Admin",
  bio: null,
  phone: null,
  phonePublic: false,
  avatarUrl: null,
  status: "ACTIVE",
  roles: ["BUYER", "ADMIN"],
  createdAt: "2026-01-01T10:00:00Z",
  lastLoginAt: "2026-10-31T08:00:00Z",
};

const mockUsers = [somchai, manee, me];

function mockPage(items: AdminUser[]): PageResponse<AdminUser> {
  return { items, page: 0, size: 20, totalItems: items.length, totalPages: 1 };
}

function mockApi(list: AdminUser[] = mockUsers) {
  vi.mocked(usersApi.getAdminUsers).mockResolvedValue(mockPage(list));
  vi.mocked(usersApi.getAdminUser).mockImplementation(async (id) => {
    const user = mockUsers.find((item) => item.id === id);
    if (!user) {
      throw new ApiError({ status: 404, code: "USER_NOT_FOUND", message: "User not found" });
    }
    return user;
  });
}

async function openRowMenu(username: string) {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: `ตัวเลือกเพิ่มเติม: ${username}` }));
  return { user, menu: await screen.findByRole("menu") };
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title, user counts, and user list table", async () => {
    mockApi();
    renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

    expect(screen.getByText("จัดการผู้ใช้")).toBeInTheDocument();
    expect(await screen.findByText("@somchai_s")).toBeInTheDocument();
    expect(screen.getByText("somchai@test.com")).toBeInTheDocument();
    expect(screen.getByText("@manee_m")).toBeInTheDocument();
    expect(screen.getAllByText("ใช้งานปกติ").length).toBeGreaterThan(0);
    expect(screen.getByText("ถูกระงับ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เพิ่มผู้ดูแล" })).toBeEnabled();
  });

  it("renders error state when user query fails", async () => {
    vi.mocked(usersApi.getAdminUsers).mockRejectedValue(new Error("Network Error"));
    renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

    expect(await screen.findByText("โหลดรายชื่อผู้ใช้ไม่สำเร็จ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ลองใหม่/ })).toBeInTheDocument();
  });

  describe("table states", () => {
    it("offers clearing filters when a filter matches nothing", async () => {
      mockApi([]);
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users?q=zzz" });

      expect(await screen.findByText("ไม่พบผู้ใช้ที่ตรงกับตัวกรอง")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "ล้างตัวกรองทั้งหมด" })).toBeInTheDocument();
    });

    it("hides the clear button when there are no users at all", async () => {
      mockApi([]);
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

      expect(await screen.findByText("ยังไม่มีผู้ใช้")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "ล้างตัวกรองทั้งหมด" })).not.toBeInTheDocument();
    });
  });

  describe("user detail sidebar", () => {
    it("opens from a row click and shows the full profile", async () => {
      mockApi();
      const user = userEvent.setup();
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

      await user.click(await screen.findByText("somchai@test.com"));

      const sheet = await screen.findByRole("dialog");
      expect(within(sheet).getByText("รายละเอียดผู้ใช้")).toBeInTheDocument();
      expect(await within(sheet).findByText("ขายการ์ดโปเกมอนมือหนึ่ง")).toBeInTheDocument();
      expect(within(sheet).getByText("081-234-5678")).toBeInTheDocument();
      expect(within(sheet).getByText("แสดงบนหน้าร้าน")).toBeInTheDocument();
      expect(within(sheet).getByText("ข้อมูลส่วนบุคคล")).toBeInTheDocument();
      expect(within(sheet).getByRole("link", { name: /ดูหน้าร้านสาธารณะ/ })).toHaveAttribute(
        "href",
        "/u/somchai_s",
      );
      expect(within(sheet).getByRole("button", { name: "ระงับบัญชี" })).toBeEnabled();
      expect(usersApi.getAdminUser).toHaveBeenCalledWith(1);
    });

    it("re-opens from ?user={id} after a reload", async () => {
      mockApi();
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users?user=2" });

      const sheet = await screen.findByRole("dialog");
      expect(await within(sheet).findByText("บัญชีนี้ถูกระงับ")).toBeInTheDocument();
      expect(within(sheet).getByText("ยังไม่ได้เขียนแนะนำตัว")).toBeInTheDocument();
      expect(within(sheet).getByRole("button", { name: "เปิดใช้งานอีกครั้ง" })).toBeInTheDocument();
      expect(usersApi.getAdminUser).toHaveBeenCalledWith(2);
    });

    it("shows a not-found state for USER_NOT_FOUND", async () => {
      mockApi();
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users?user=404" });

      const sheet = await screen.findByRole("dialog");
      expect(await within(sheet).findByText("ไม่พบบัญชีนี้แล้ว")).toBeInTheDocument();
      expect(within(sheet).getByRole("button", { name: "กลับไปที่รายการ" })).toBeInTheDocument();
    });

    it("locks actions on the admin's own account", async () => {
      mockApi();
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users?user=99" });

      const sheet = await screen.findByRole("dialog");
      expect(await within(sheet).findByText("นี่คือบัญชีของคุณ")).toBeInTheDocument();
      expect(within(sheet).getByRole("button", { name: "ระงับบัญชี" })).toBeDisabled();
      expect(within(sheet).queryByRole("button", { name: "จัดการบทบาท…" })).not.toBeInTheDocument();
    });
  });

  describe("row menu", () => {
    it("lets the admin's own row only view details", async () => {
      mockApi();
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

      const { menu } = await openRowMenu("superadmin");
      expect(within(menu).getByRole("menuitem", { name: "ดูรายละเอียด" })).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );
      for (const name of ["จัดการบทบาท…", "ระงับบัญชี", "ปิดบัญชี"]) {
        expect(within(menu).getByRole("menuitem", { name })).toHaveAttribute("aria-disabled", "true");
      }
      expect(within(menu).getByText(/นี่คือบัญชีของคุณ/)).toBeInTheDocument();
    });

    it("confirms suspension with a user summary", async () => {
      mockApi();
      vi.mocked(usersApi.updateUserStatus).mockResolvedValue({ ...somchai, status: "SUSPENDED" });
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

      const { user, menu } = await openRowMenu("somchai_s");
      await user.click(within(menu).getByRole("menuitem", { name: "ระงับบัญชี" }));

      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("ระงับบัญชี @somchai_s?")).toBeInTheDocument();
      expect(within(dialog).getByText("somchai@test.com")).toBeInTheDocument();
      expect(within(dialog).getByText(/เพิกถอน refresh token/)).toBeInTheDocument();

      await user.click(within(dialog).getByRole("button", { name: "ระงับบัญชี" }));
      await waitFor(() => expect(usersApi.updateUserStatus).toHaveBeenCalledWith(1, "SUSPENDED"));
    });
  });

  describe("role dialog", () => {
    it("grants SUPPORT without an extra confirm", async () => {
      mockApi();
      vi.mocked(usersApi.grantRole).mockResolvedValue(["BUYER", "SELLER", "SUPPORT"]);
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

      const { user, menu } = await openRowMenu("somchai_s");
      await user.click(within(menu).getByRole("menuitem", { name: "จัดการบทบาท…" }));

      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("ค่าเริ่มต้น")).toBeInTheDocument();
      expect(within(dialog).getByText("จากการอนุมัติ")).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: "บันทึก" })).toBeDisabled();

      await user.click(within(dialog).getByRole("switch", { name: "ทีมซัพพอร์ต" }));
      await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));

      await waitFor(() => expect(usersApi.grantRole).toHaveBeenCalledWith(1, "SUPPORT"));
      expect(usersApi.revokeRole).not.toHaveBeenCalled();
    });

    it("asks to confirm before granting ADMIN", async () => {
      mockApi();
      vi.mocked(usersApi.grantRole).mockResolvedValue(["BUYER", "SELLER", "ADMIN"]);
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });

      const { user, menu } = await openRowMenu("somchai_s");
      await user.click(within(menu).getByRole("menuitem", { name: "จัดการบทบาท…" }));
      const dialog = await screen.findByRole("alertdialog");
      await user.click(within(dialog).getByRole("switch", { name: "ผู้ดูแล" }));
      await user.click(within(dialog).getByRole("button", { name: "บันทึก" }));

      const title = await screen.findByText("ตั้ง @somchai_s เป็นผู้ดูแล?");
      expect(usersApi.grantRole).not.toHaveBeenCalled();
      const confirm = title.closest("[role=alertdialog]") as HTMLElement;
      await user.click(within(confirm).getByRole("button", { name: "ตั้งเป็นผู้ดูแล" }));
      await waitFor(() => expect(usersApi.grantRole).toHaveBeenCalledWith(1, "ADMIN"));
    });
  });

  describe("add admin dialog", () => {
    it("searches existing accounts and disables current admins", async () => {
      mockApi();
      const user = userEvent.setup();
      renderWithProviders(<AdminUsersPage />, { route: "/admin/users" });
      await screen.findByText("@somchai_s");

      vi.mocked(usersApi.getAdminUsers).mockResolvedValue(mockPage([somchai, me]));
      await user.click(screen.getByRole("button", { name: "เพิ่มผู้ดูแล" }));
      const dialog = await screen.findByRole("alertdialog");
      await user.type(within(dialog).getByRole("searchbox"), "s");

      expect(await within(dialog).findByText("เป็นผู้ดูแลแล้ว")).toBeInTheDocument();
      expect(usersApi.getAdminUsers).toHaveBeenCalledWith({ q: "s", page: 0, size: 5 });
      const radios = within(dialog).getAllByRole("radio");
      expect(radios[1]).toHaveAttribute("aria-disabled", "true");
      expect(within(dialog).getByRole("button", { name: "ถัดไป" })).toBeDisabled();

      await user.click(radios[0]);
      await user.click(within(dialog).getByRole("button", { name: "ถัดไป" }));
      expect(await screen.findByText("ตั้ง @somchai_s เป็นผู้ดูแล?")).toBeInTheDocument();
    });
  });
});
