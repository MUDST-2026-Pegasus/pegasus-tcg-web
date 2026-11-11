import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Redirect tests only care about the router location. Stub the layout (Navbar/cart/promotions
// fire real network queries) and the lazily-loaded search page so no async work outlives the
// test file — otherwise late console logs race the worker teardown
// ("Closing rpc while onUserConsoleLog was pending").
vi.mock("@/components/layout/PublicLayout", async () => {
  const { Outlet } = await import("react-router-dom");
  return { PublicLayout: () => <Outlet /> };
});
vi.mock("@/features/catalog/pages/SearchResultsPage", () => ({
  SearchResultsPage: () => <div data-testid="search-results-page" />,
}));

import { publicRoutes } from "@/app/routes/public.routes";
import * as catalogApi from "@/features/catalog/catalog.api";
import type { GameDto } from "@/features/catalog/catalog.types";
import { createTestQueryClient } from "@/test/utils";

const getGames = vi.spyOn(catalogApi, "getGames");

describe("legacy route redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([]);
  });

  afterEach(async () => {
    // Make sure the lazy target page has settled before the test (and environment) ends.
    expect(await screen.findByTestId("search-results-page")).toBeInTheDocument();
  });

  it("redirects /products to /search", async () => {
    const router = createMemoryRouter([publicRoutes], { initialEntries: ["/products"] });
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/search");
      expect(router.state.location.search).toBe("");
    });
  });

  it("redirects /pokemon to /search with fallback pokemon-tcg slug", async () => {
    const router = createMemoryRouter([publicRoutes], { initialEntries: ["/pokemon"] });
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/search");
      expect(router.state.location.search).toBe("?game=pokemon-tcg");
    });
  });

  it("redirects /one-piece to /search with fallback one-piece-card-game slug", async () => {
    const router = createMemoryRouter([publicRoutes], { initialEntries: ["/one-piece"] });
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/search");
      expect(router.state.location.search).toBe("?game=one-piece-card-game");
    });
  });

  it("redirects /pokemon to /search with dynamically fetched slug", async () => {
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
    ];
    getGames.mockResolvedValue(mockGames);

    const router = createMemoryRouter([publicRoutes], { initialEntries: ["/pokemon"] });
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/search");
      expect(router.state.location.search).toBe("?game=pokemon-pocket");
    });
  });
});
