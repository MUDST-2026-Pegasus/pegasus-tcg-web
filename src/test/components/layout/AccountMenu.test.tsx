import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { render } from "@/test/utils";

const state = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: false,
  user: null as null | {
    displayName: string;
    email: string;
    avatarUrl: string | null;
  },
  links: [] as { label: string; to: string }[],
  logoutPending: false,
}));
vi.mock("@/components/layout/nav-shared", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/layout/nav-shared")>();
  return {
    ...actual,
    useAccountLinks: () => ({ ...state, handleLogout: vi.fn() }),
  };
});

function showMenu() {
  render(
    <MemoryRouter>
      <AccountMenu />
    </MemoryRouter>,
  );
}

describe("AccountMenu states", () => {
  beforeEach(() => {
    state.isLoading = false;
    state.isAuthenticated = false;
    state.user = null;
    state.links = [];
    state.logoutPending = false;
  });

  it("shows a skeleton without an account menu while auth is loading", () => {
    state.isLoading = true;
    showMenu();
    expect(screen.getByLabelText("กำลังโหลดบัญชี")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "บัญชี" }),
    ).not.toBeInTheDocument();
  });

  it("offers guest login and signup", async () => {
    state.links = [
      { label: "เข้าสู่ระบบ", to: "/login" },
      { label: "สมัครสมาชิก", to: "/register" },
    ];
    showMenu();
    fireEvent.click(screen.getByRole("button", { name: "บัญชี" }));
    expect(
      await screen.findByRole("menuitem", { name: "เข้าสู่ระบบ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "สมัครสมาชิก" }),
    ).toBeInTheDocument();
  });

  it("shows the signed-in name, seller destination, and logout", async () => {
    state.isAuthenticated = true;
    state.user = {
      displayName: "Somchai K.",
      email: "somchai@example.com",
      avatarUrl: null,
    };
    state.links = [
      { label: "บัญชีของฉัน", to: "/account/profile" },
      { label: "แดชบอร์ดผู้ขาย", to: "/seller" },
    ];
    showMenu();
    expect(screen.getByRole("button", { name: "บัญชี" })).toHaveTextContent(
      "Somchai K.",
    );
    fireEvent.click(screen.getByRole("button", { name: "บัญชี" }));
    expect(
      await screen.findByRole("menuitem", { name: "แดชบอร์ดผู้ขาย" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "ออกจากระบบ" }),
    ).toBeInTheDocument();
  });
});
