import { Tabs } from "@/components/ui/tabs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductAuctionBox } from "@/features/catalog/components/ProductAuctionBox";
import * as auctionApi from "@/features/auction/auction.api";
import { summarizeAuctions } from "@/features/auction/auction.format";
import { AUCTION_PAGE_FIXTURE } from "@/features/auction/auction.fixture";
import type { AuctionPage, AuctionSummary } from "@/features/auction/auction.types";
import { AuctionSourcePill } from "@/features/auction/components/AuctionSourcePill";
import { AuctionEndingSoonSection } from "@/features/home/components/AuctionEndingSoonSection";
import { StoreTabs } from "@/features/store/components/StoreTabs";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

const SUMMARIES = AUCTION_PAGE_FIXTURE.page.items;

function pageOf(items: AuctionSummary[]): AuctionPage {
  return {
    ...AUCTION_PAGE_FIXTURE,
    page: { items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 },
    serverTime: new Date().toISOString(),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Home · ประมูลใกล้จบ", () => {
  it("shows up to 4 auctions ending soonest with the header", async () => {
    const get = vi.spyOn(auctionApi, "getAuctions").mockResolvedValue(pageOf(SUMMARIES.slice(0, 4)));
    renderWithProviders(<AuctionEndingSoonSection />);

    expect(await screen.findByRole("heading", { name: "ประมูลใกล้จบ" })).toBeInTheDocument();
    expect(screen.getByText("บิดก่อนหมดเวลา — มีคนบิดช่วงท้าย เวลาจะต่อให้อีก 2 นาที")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ดูประมูลทั้งหมด/ })).toHaveAttribute("href", "/auctions");
    for (const auction of SUMMARIES.slice(0, 4)) {
      expect(screen.getByText(auction.item.card.productName)).toBeInTheDocument();
    }
    expect(get).toHaveBeenCalledWith({ sort: "ENDING_SOON", size: 4 });
  });

  it("hides the whole section when no auction is open", async () => {
    const get = vi.spyOn(auctionApi, "getAuctions").mockResolvedValue(pageOf([]));
    const { container } = renderWithProviders(<AuctionEndingSoonSection />);

    await waitFor(() => expect(get).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByText("ประมูลใกล้จบ")).not.toBeInTheDocument();
  });
});

describe("ProductAuctionBox", () => {
  it("shows the count, lowest price and a link when the card has open auctions", async () => {
    const [first] = SUMMARIES;
    vi.spyOn(auctionApi, "getAuctions").mockResolvedValue(pageOf([first]));
    renderWithProviders(<ProductAuctionBox variantIds={[first.item.card.variantId]} productName={first.item.card.productName} />);

    expect(await screen.findByText("มีประมูลการ์ดนี้อยู่ 1 รายการ")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`ราคาบิดต่ำสุดตอนนี้ THB ${first.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} · ใกล้จบใน`))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ดูประมูล/ })).toHaveAttribute("href", `/auctions/${first.id}`);
  });

  it("renders nothing when the card has no open auction", async () => {
    const get = vi.spyOn(auctionApi, "getAuctions").mockResolvedValue(pageOf([]));
    const { container } = renderWithProviders(<ProductAuctionBox variantIds={[1, 2]} productName="Pikachu" />);

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(container).toBeEmptyDOMElement();
  });

  it("asks once per variant when all variants are selected", async () => {
    const get = vi.spyOn(auctionApi, "getAuctions").mockResolvedValue(pageOf([]));
    renderWithProviders(<ProductAuctionBox variantIds={[11, 12]} productName="Pikachu" />);

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(get).toHaveBeenCalledWith({ variantId: 11, sort: "ENDING_SOON" });
    expect(get).toHaveBeenCalledWith({ variantId: 12, sort: "ENDING_SOON" });
  });

  it("summarizeAuctions picks the lowest price and the soonest end", () => {
    const summary = summarizeAuctions(SUMMARIES, 0);
    expect(summary?.count).toBe(SUMMARIES.length);
    expect(summary?.lowest).toBe(Math.min(...SUMMARIES.map((a) => a.currentPrice)));
    expect(summary?.soonest.endsAt).toBe([...SUMMARIES].sort((a, b) => a.endsAt.localeCompare(b.endsAt))[0].endsAt);
    expect(summarizeAuctions([], 0)).toBeNull();
  });
});

describe("AuctionSourcePill", () => {
  it("shows a link to the auction only for source = AUCTION", () => {
    renderWithProviders(<AuctionSourcePill order={{ source: "AUCTION", auctionId: 142, auctionNumber: "AUC-2026-0142" }} basePath="/seller/auctions" />);
    const link = screen.getByRole("link", { name: "จากการประมูล #AUC-2026-0142" });
    expect(link).toHaveAttribute("href", "/seller/auctions/142");
  });

  it.each([
    ["CART order", { source: "CART" as const, auctionId: null, auctionNumber: null }],
    ["old API without the fields", {}],
  ])("shows nothing for a %s", (_, order) => {
    const { container } = renderWithProviders(<AuctionSourcePill order={order} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("can render without a link inside another button", () => {
    renderWithProviders(<AuctionSourcePill order={{ source: "AUCTION", auctionId: 142, auctionNumber: "AUC-2026-0142" }} link={false} />);
    expect(screen.getByText("จากการประมูล #AUC-2026-0142")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("StoreTabs · ประมูล", () => {
  it("hides the auction tab when the shop has no open auction", () => {
    renderWithProviders(
      <Tabs value="products">
        <StoreTabs activeTab="products" listingsTotal={3} collectionTotal={1} ratingCount={2} />
      </Tabs>,
    );
    expect(screen.queryByRole("tab", { name: /ประมูล/ })).not.toBeInTheDocument();
  });

  it("shows the auction tab with its count", () => {
    renderWithProviders(
      <Tabs value="products">
        <StoreTabs activeTab="products" listingsTotal={3} collectionTotal={1} ratingCount={2} auctionsTotal={2} />
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "ประมูล (2)" })).toBeInTheDocument();
  });
});
