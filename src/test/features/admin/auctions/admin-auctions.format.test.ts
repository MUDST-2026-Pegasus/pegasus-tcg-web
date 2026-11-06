import { describe, expect, it } from "vitest";

import {
  auctionFlags,
  bidderMeta,
  canSuspend,
  formatBidSecond,
  memberAge,
} from "@/features/admin/auctions/admin-auctions.format";
import { banTabOf, matchesAdminAuctionTab } from "@/features/auction/auction.format";
import { ADMIN_AUCTION_PAGE_FIXTURE, BANNED_BIDDER_PAGE_FIXTURE } from "@/features/auction/auction.fixture";
import type { AuctionStatus } from "@/features/auction/auction.types";

const DAY = 86_400_000;
const NOW = Date.parse("2026-10-31T21:00:00+07:00");
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

describe("canSuspend", () => {
  it.each<[AuctionStatus, boolean]>([
    ["LIVE", true],
    ["AWAITING_PAYMENT", false],
    ["SOLD", false],
    ["UNSOLD", false],
    ["CANCELLED", false],
    ["SUSPENDED", false],
  ])("%s → %s", (status, expected) => {
    expect(canSuspend(status)).toBe(expected);
  });
});

describe("auctionFlags", () => {
  it("groups bidding signals as one flag and counts reports", () => {
    expect(auctionFlags(["NEW_ACCOUNT_RAPID_BIDS", "SHARED_ADDRESS_WITH_SELLER"], 0)).toEqual(["บิดผิดปกติ"]);
    expect(auctionFlags(["REPORTED"], 3)).toEqual(["ถูกรายงาน 3"]);
    expect(auctionFlags([], 0)).toEqual([]);
  });
});

describe("member age", () => {
  it("uses days, weeks, months and years", () => {
    expect(memberAge(ago(2), NOW)).toBe("2 วัน");
    expect(memberAge(ago(14), NOW)).toBe("2 สัปดาห์");
    expect(memberAge(ago(240), NOW)).toBe("8 เดือน");
    expect(memberAge(ago(730), NOW)).toBe("2 ปี");
  });

  it("calls accounts under 30 days new", () => {
    expect(bidderMeta(ago(2), 0, NOW)).toBe("สมัคร 2 วัน · 0 คำสั่งซื้อ");
    expect(bidderMeta(ago(365), 23, NOW)).toBe("สมาชิก 1 ปี · 23 คำสั่งซื้อ");
  });
});

it("formatBidSecond shows Thai time to the second", () => {
  expect(formatBidSecond("2026-10-31T13:59:41Z")).toBe("31 ต.ค. 20:59:41");
});

describe("tab filters", () => {
  it("puts each admin row in the right tab", () => {
    const ids = (tab: Parameters<typeof matchesAdminAuctionTab>[0]) =>
      ADMIN_AUCTION_PAGE_FIXTURE.page.items.filter((row) => matchesAdminAuctionTab(tab, row)).map((row) => row.id);
    expect(ids("FLAGGED")).toEqual([139, 155]);
    expect(ids("ENDED")).toEqual([133]);
    expect(ids("SUSPENDED")).toEqual([98]);
  });

  it("splits banned users into banned / near / history", () => {
    const tabs = Object.fromEntries(BANNED_BIDDER_PAGE_FIXTURE.page.items.map((b) => [b.username, banTabOf(b)]));
    expect(tabs["kanok.a"]).toBe("BANNED");
    expect(tabs["jay.collect"]).toBe("AT_RISK");
    expect(tabs["aom.s"]).toBe("HISTORY");
    expect(tabs["tee.k"]).toBe("HISTORY");
  });
});
