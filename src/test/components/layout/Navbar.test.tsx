import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { Navbar } from "@/components/layout/Navbar";
import * as catalogApi from "@/features/catalog/catalog.api";
import type { GameDto } from "@/features/catalog/catalog.types";
import { createTestQueryClient, render } from "@/test/utils";

vi.mock("@/components/layout/AccountMenu", () => ({ AccountMenu: () => null }));
vi.mock("@/features/cart/cart.api", () => ({
  cartApi: {
    getCart: vi.fn().mockResolvedValue({
      id: 1,
      userId: null,
      sessionKey: null,
      currency: "THB",
      items: [],
      totalQuantity: 0,
      itemsSubtotal: 0,
      expiresAt: null,
    }),
  },
}));

const getGames = vi.spyOn(catalogApi, "getGames");

function renderNavbar(initialEntry = "/") {
  const queryClient = createTestQueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Navbar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

describe("Navbar navigation links and active states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([]);
  });

  it("renders default fallback links when game list is not loaded", () => {
    renderNavbar("/");

    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /all products/i })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: /pokemon/i })).toHaveAttribute("href", "/search?game=pokemon-tcg");
    expect(screen.getByRole("link", { name: /one piece/i })).toHaveAttribute("href", "/search?game=one-piece-card-game");
  });

  it("dynamically resolves game slugs from useGameList", async () => {
    const mockGames: GameDto[] = [
      {
        id: 1,
        code: "POKEMON",
        name: "Pokémon",
        nameLocal: "โปเกมอน",
        slug: "pokemon-pocket",
        logoUrl: null,
        displayOrder: 1,
      },
      {
        id: 2,
        code: "ONE_PIECE",
        name: "One Piece",
        nameLocal: "วันพีซ",
        slug: "one-piece-cards",
        logoUrl: null,
        displayOrder: 2,
      },
    ];
    getGames.mockResolvedValue(mockGames);

    renderNavbar("/");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /pokemon/i })).toHaveAttribute(
        "href",
        "/search?game=pokemon-pocket",
      );
      expect(screen.getByRole("link", { name: /one piece/i })).toHaveAttribute(
        "href",
        "/search?game=one-piece-cards",
      );
    });
  });

  it("activates only HOME on '/'", () => {
    renderNavbar("/");

    const homeLink = screen.getByRole("link", { name: /home/i });
    const allProductsLink = screen.getByRole("link", { name: /all products/i });
    const pokemonLink = screen.getByRole("link", { name: /pokemon/i });
    const onePieceLink = screen.getByRole("link", { name: /one piece/i });

    expect(homeLink).toHaveTextContent("HOME");
    expect(homeLink.querySelector(".text-primary")).toBeInTheDocument();
    expect(homeLink.querySelector(".bg-primary")).toBeInTheDocument();

    expect(allProductsLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(allProductsLink.querySelector(".bg-transparent")).toBeInTheDocument();

    expect(pokemonLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(pokemonLink.querySelector(".bg-transparent")).toBeInTheDocument();

    expect(onePieceLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(onePieceLink.querySelector(".bg-transparent")).toBeInTheDocument();
  });

  it("activates only ALL PRODUCTS on '/search' without game filter", () => {
    renderNavbar("/search");

    const homeLink = screen.getByRole("link", { name: /home/i });
    const allProductsLink = screen.getByRole("link", { name: /all products/i });
    const pokemonLink = screen.getByRole("link", { name: /pokemon/i });
    const onePieceLink = screen.getByRole("link", { name: /one piece/i });

    expect(allProductsLink.querySelector(".text-primary")).toBeInTheDocument();
    expect(allProductsLink.querySelector(".bg-primary")).toBeInTheDocument();

    expect(homeLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(pokemonLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(onePieceLink.querySelector(".text-zinc-700")).toBeInTheDocument();
  });

  it("activates only POKEMON on '/search?game=pokemon-tcg'", () => {
    renderNavbar("/search?game=pokemon-tcg");

    const homeLink = screen.getByRole("link", { name: /home/i });
    const allProductsLink = screen.getByRole("link", { name: /all products/i });
    const pokemonLink = screen.getByRole("link", { name: /pokemon/i });
    const onePieceLink = screen.getByRole("link", { name: /one piece/i });

    expect(pokemonLink.querySelector(".text-primary")).toBeInTheDocument();
    expect(pokemonLink.querySelector(".bg-primary")).toBeInTheDocument();

    expect(homeLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(allProductsLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(onePieceLink.querySelector(".text-zinc-700")).toBeInTheDocument();
  });

  it("activates only ONE PIECE on '/search?game=one-piece-card-game'", () => {
    renderNavbar("/search?game=one-piece-card-game");

    const homeLink = screen.getByRole("link", { name: /home/i });
    const allProductsLink = screen.getByRole("link", { name: /all products/i });
    const pokemonLink = screen.getByRole("link", { name: /pokemon/i });
    const onePieceLink = screen.getByRole("link", { name: /one piece/i });

    expect(onePieceLink.querySelector(".text-primary")).toBeInTheDocument();
    expect(onePieceLink.querySelector(".bg-primary")).toBeInTheDocument();

    expect(homeLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(allProductsLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(pokemonLink.querySelector(".text-zinc-700")).toBeInTheDocument();
  });

  it("does not activate any game tabs on non-search pages like '/cart'", () => {
    renderNavbar("/cart");

    const homeLink = screen.getByRole("link", { name: /home/i });
    const allProductsLink = screen.getByRole("link", { name: /all products/i });
    const pokemonLink = screen.getByRole("link", { name: /pokemon/i });
    const onePieceLink = screen.getByRole("link", { name: /one piece/i });

    expect(homeLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(allProductsLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(pokemonLink.querySelector(".text-zinc-700")).toBeInTheDocument();
    expect(onePieceLink.querySelector(".text-zinc-700")).toBeInTheDocument();
  });
});
