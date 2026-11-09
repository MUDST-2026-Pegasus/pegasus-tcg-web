import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RecommendedShopsSection } from "@/features/home/components/HomeContent";
import { ShopCard } from "@/features/home/components/ShopCard";
import * as homeApi from "@/features/home/home.api";
import type { RecommendedShopDto } from "@/features/home/home.types";
import { createTestQueryClient } from "@/test/utils";

vi.mock("@/features/home/home.api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/home/home.api")>(),
  getRecommendedShops: vi.fn(),
}));

const shop: RecommendedShopDto = {
  username: "siamcardhouse",
  displayName: "Siam Card House",
  avatarUrl: null, bannerUrl: null,
  ratingAvg: 4.9,
  ratingCount: 128,
  activeListingCount: 342,
  previews: [
    { listingId: 1, imageUrl: "/card-1.jpg" },
    { listingId: 2, imageUrl: "/card-2.jpg" },
    { listingId: 3, imageUrl: "/card-3.jpg" },
  ],
};

it('shows a shop banner and falls back when its URL fails', () => {
  render(<MemoryRouter><ShopCard shop={{ ...shop, bannerUrl: '/shop-banner.webp' }} /></MemoryRouter>);
  const banner = screen.getByAltText('แบนเนอร์ร้าน Siam Card House');
  expect(banner).toHaveAttribute('src', '/shop-banner.webp');
  fireEvent.error(banner);
  expect(screen.queryByAltText('แบนเนอร์ร้าน Siam Card House')).not.toBeInTheDocument();
});

function renderSection() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return render(<RecommendedShopsSection />, { wrapper });
}

beforeEach(() => {
  const Observer = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  vi.stubGlobal("IntersectionObserver", Observer);
  vi.stubGlobal("ResizeObserver", Observer);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("RecommendedShopsSection", () => {
  it("shows a skeleton while loading", () => {
    vi.mocked(homeApi.getRecommendedShops).mockReturnValue(new Promise(() => {}));
    renderSection();

    expect(screen.getByRole("region", { name: "ร้านค้าแนะนำ" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /เข้าชมร้าน/ })).not.toBeInTheDocument();
  });

  it("keeps the API order and makes the whole card one focusable link", async () => {
    vi.mocked(homeApi.getRecommendedShops).mockResolvedValue([
      shop,
      { ...shop, username: "second", displayName: "Second Shop", ratingCount: 0, previews: [] },
    ]);
    renderSection();

    const links = await screen.findAllByRole("link", { name: /เข้าชมร้าน/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/u/siamcardhouse", "/u/second",
    ]);
    expect(links[0]).toHaveClass("focus-visible:ring-3");
    expect(within(links[0]).queryByRole("link")).not.toBeInTheDocument();
    expect(within(links[0]).getAllByAltText(/ตัวอย่างสินค้า/)).toHaveLength(3);
    expect(within(links[1]).getByText("ร้านใหม่")).toBeInTheDocument();
    expect(within(links[1]).queryByText(/รีวิว/)).not.toBeInTheDocument();
    expect(within(links[1]).queryAllByAltText(/ตัวอย่างสินค้า/)).toHaveLength(0);
  });

  it("hides the section when the API returns no shops", async () => {
    vi.mocked(homeApi.getRecommendedShops).mockResolvedValue([]);
    renderSection();

    await waitFor(() => expect(screen.queryByRole("region", { name: "ร้านค้าแนะนำ" })).not.toBeInTheDocument());
  });

  it("hides the section when the API fails", async () => {
    vi.mocked(homeApi.getRecommendedShops).mockRejectedValue(new Error("Unavailable"));
    renderSection();

    await waitFor(() => expect(screen.queryByRole("region", { name: "ร้านค้าแนะนำ" })).not.toBeInTheDocument());
  });
});
