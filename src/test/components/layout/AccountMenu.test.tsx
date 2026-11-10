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
    expect(screen.getByLabelText("Loading account")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Account" }),
    ).not.toBeInTheDocument();
  });

  it("offers guest login and signup", async () => {
    state.links = [
      { label: "Log in", to: "/login" },
      { label: "Sign up", to: "/register" },
    ];
    showMenu();
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    expect(
      await screen.findByRole("menuitem", { name: "Log in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Sign up" }),
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
      { label: "My Account", to: "/account/profile" },
      { label: "Seller Dashboard", to: "/seller" },
    ];
    showMenu();
    expect(screen.getByRole("button", { name: "Account" })).toHaveTextContent(
      "Somchai K.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    expect(
      await screen.findByRole("menuitem", { name: "Seller Dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Log out" }),
    ).toBeInTheDocument();
  });
});
