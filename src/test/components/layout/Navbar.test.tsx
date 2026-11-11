import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import * as catalogApi from "@/features/catalog/catalog.api";
import { createTestQueryClient, render } from "@/test/utils";

const authState = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: false,
  role: "",
}));
vi.mock("@/components/layout/AccountMenu", () => ({ AccountMenu: () => null }));
vi.mock("@/components/layout/nav-shared", () => ({
  useAccountLinks: () => {
    const sellerLink =
      authState.role === "SELLER"
        ? { label: "แดชบอร์ดผู้ขาย", to: "/seller" }
        : { label: "สมัครเป็นผู้ขาย", to: "/become-a-seller" };
    return {
      user: null,
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      sellerLink,
      links: authState.isAuthenticated ? [sellerLink] : [],
      handleLogout: vi.fn(),
      logoutPending: false,
    };
  },
  AccountAvatar: () => null,
}));
vi.mock("@/features/cart/cart.api", () => ({
  cartApi: {
    getCart: vi.fn().mockResolvedValue({ items: [], totalQuantity: 0 }),
  },
}));
const getGames = vi.spyOn(catalogApi, "getGames");
function Location() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}
function renderNavbar(path = "/") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Navbar />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const categoryNav = () =>
  screen.getByRole("navigation", { name: "หมวดหมู่สินค้า" });
const activeLabels = () =>
  Array.from(categoryNav().querySelectorAll('[aria-current="page"]')).map(
    (element) => element.textContent,
  );

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([]);
    authState.isLoading = false;
    authState.isAuthenticated = false;
    authState.role = "";
  });
  it.each([
    ["/", "หน้าแรก"],
    ["/search", "สินค้าทั้งหมด"],
    ["/search?game=pokemon-tcg", "Pokémon"],
    ["/search?game=one-piece-card-game", "One Piece"],
    ["/search?sort=newest", "มาใหม่"],
    ["/auctions", "ประมูล"],
    ["/auctions/142", "ประมูล"],
    ["/search?q=Pikachu", "สินค้าทั้งหมด"],
    ["/search?game=pokemon-tcg&sort=newest", "Pokémon"],
    ["/cart", null],
  ])("marks only the current category at %s", (path, label) => {
    renderNavbar(path);
    expect(activeLabels()).toEqual(label ? [label] : []);
  });
  it("resolves game slugs from the catalog", async () => {
    getGames.mockResolvedValue([
      {
        id: 1,
        code: "POKEMON",
        name: "Pokémon",
        nameLocal: "",
        slug: "pokemon-pocket",
        logoUrl: null,
        displayOrder: 1,
      },
    ]);
    renderNavbar();
    await waitFor(() =>
      expect(
        categoryNav().querySelector('a[href="/search?game=pokemon-pocket"]'),
      ).toBeInTheDocument(),
    );
  });
  it("submits a search and preserves the game filter while resetting page", () => {
    renderNavbar("/search?game=pokemon-tcg&page=3&q=old");
    const input = screen.getAllByRole("textbox", { name: "ค้นหา" })[0];
    expect(input).toHaveValue("old");
    fireEvent.change(input, { target: { value: "Pikachu" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/search?game=pokemon-tcg&q=Pikachu",
    );
  });
  it("focuses search with slash unless another field is active", () => {
    renderNavbar();
    const input = screen.getAllByRole("textbox", { name: "ค้นหา" })[0];
    fireEvent.keyDown(window, { key: "/" });
    expect(input).toHaveFocus();
    const other = document.createElement("input");
    document.body.append(other);
    other.focus();
    fireEvent.keyDown(other, { key: "/" });
    expect(other).toHaveFocus();
    other.remove();
    input.focus();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).not.toHaveFocus();
  });
  it("hides the seller link for guests, shows it for buyers, and sends sellers to their dashboard", () => {
    const { unmount } = renderNavbar();
    expect(
      categoryNav().querySelector('a[href="/become-a-seller"]'),
    ).not.toBeInTheDocument();
    unmount();
    authState.isAuthenticated = true;
    const buyer = renderNavbar();
    expect(
      categoryNav().querySelector('a[href="/become-a-seller"]'),
    ).toHaveTextContent("สมัครเป็นผู้ขาย");
    buyer.unmount();
    authState.isAuthenticated = true;
    authState.role = "SELLER";
    renderNavbar();
    expect(categoryNav().querySelector('a[href="/seller"]')).toHaveTextContent(
      "แดชบอร์ดผู้ขาย",
    );
  });
  it("hides the seller link while the account role is loading", () => {
    authState.isLoading = true;
    renderNavbar();
    expect(
      categoryNav().querySelector('a[href="/become-a-seller"]'),
    ).not.toBeInTheDocument();
    expect(
      categoryNav().querySelector('a[href="/seller"]'),
    ).not.toBeInTheDocument();
  });
  it("shows guest account actions without a seller link in the mobile drawer", async () => {
    renderNavbar();
    fireEvent.click(screen.getByRole("button", { name: "เปิดเมนู" }));
    expect(
      await screen.findByText("เข้าสู่ระบบเพื่อดูคำสั่งซื้อและคอลเลกชันของคุณ"),
    ).toBeInTheDocument();
    expect(screen.queryByText("SELL")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "สมัครเป็นผู้ขาย" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เข้าสู่ระบบ" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("button", { name: "สมัครสมาชิก" })).toHaveAttribute(
      "href",
      "/register",
    );
    fireEvent.click(screen.getByRole("dialog").querySelector('a[href="/"]')!);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it.each([
    ["", "สมัครเป็นผู้ขาย", "/become-a-seller"],
    ["SELLER", "แดชบอร์ดผู้ขาย", "/seller"],
  ])(
    "shows the correct mobile seller destination for role %s",
    async (role, label, to) => {
      authState.isAuthenticated = true;
      authState.role = role;
      renderNavbar();
      fireEvent.click(screen.getByRole("button", { name: "เปิดเมนู" }));
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("บัญชี")).toBeInTheDocument();
      expect(
        screen.getByRole("dialog").querySelector(`a[href="${to}"]`),
      ).toHaveTextContent(label);
    },
  );
});
