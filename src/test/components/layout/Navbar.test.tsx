import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import * as catalogApi from "@/features/catalog/catalog.api";
import { createTestQueryClient, render } from "@/test/utils";

vi.mock("@/components/layout/AccountMenu", () => ({ AccountMenu: () => null }));
vi.mock("@/components/layout/nav-shared", () => ({ useAccountLinks: () => ({ user: null, isAuthenticated: false, hasRole: () => false, links: [], handleLogout: vi.fn(), logoutPending: false }), AccountAvatar: () => null }));
vi.mock("@/features/cart/cart.api", () => ({ cartApi: { getCart: vi.fn().mockResolvedValue({ items: [], totalQuantity: 0 }) } }));
const getGames = vi.spyOn(catalogApi, "getGames");
function Location() { const location = useLocation(); return <div data-testid="location">{location.pathname}{location.search}</div>; }
function renderNavbar(path = "/") {
  render(<QueryClientProvider client={createTestQueryClient()}><MemoryRouter initialEntries={[path]}><Navbar /><Location /></MemoryRouter></QueryClientProvider>);
}
const categoryNav = () => screen.getByRole("navigation", { name: "Shop categories" });
const activeLabels = () => Array.from(categoryNav().querySelectorAll('[aria-current="page"]')).map((element) => element.textContent);

describe("Navbar", () => {
  beforeEach(() => { vi.clearAllMocks(); getGames.mockResolvedValue([]); });
  it.each([
    ["/", "Home"], ["/search", "All products"], ["/search?game=pokemon-tcg", "Pokémon"],
    ["/search?game=one-piece-card-game", "One Piece"], ["/search?sort=newest", "New arrivals"], ["/cart", null],
  ])("marks only the current category at %s", (path, label) => {
    renderNavbar(path);
    expect(activeLabels()).toEqual(label ? [label] : []);
  });
  it("resolves game slugs from the catalog", async () => {
    getGames.mockResolvedValue([{ id: 1, code: "POKEMON", name: "Pokémon", nameLocal: "", slug: "pokemon-pocket", logoUrl: null, displayOrder: 1 }]);
    renderNavbar();
    await waitFor(() => expect(categoryNav().querySelector('a[href="/search?game=pokemon-pocket"]')).toBeInTheDocument());
  });
  it("submits a search and preserves the game filter while resetting page", () => {
    renderNavbar("/search?game=pokemon-tcg&page=3&q=old");
    const input = screen.getAllByRole("textbox", { name: "ค้นหา" })[0];
    expect(input).toHaveValue("old");
    fireEvent.change(input, { target: { value: "Pikachu" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByTestId("location")).toHaveTextContent("/search?game=pokemon-tcg&q=Pikachu");
  });
  it("focuses search with slash unless another field is active", () => {
    renderNavbar();
    const input = screen.getAllByRole("textbox", { name: "ค้นหา" })[0];
    fireEvent.keyDown(window, { key: "/" });
    expect(input).toHaveFocus();
    const other = document.createElement("input"); document.body.append(other); other.focus();
    fireEvent.keyDown(other, { key: "/" });
    expect(other).toHaveFocus(); other.remove();
  });
});
