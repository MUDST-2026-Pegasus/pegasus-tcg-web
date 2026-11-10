import { describe, expect, it } from "vitest";

import { SELLER_AUCTION_DETAIL_FIXTURES } from "@/features/auction/auction.fixture";
import {
  buyNowSetting,
  sellerNoticeKind,
  timelineSteps,
  toSellerAuctionRow,
} from "@/features/seller/auctions/seller-auction-detail.format";

const F = SELLER_AUCTION_DETAIL_FIXTURES;
const tones = (id: number) => timelineSteps(F[id]).map((step) => [step.id, step.tone]);

describe("timelineSteps", () => {
  it("live with bids: past steps green, live is now, rest grey", () => {
    expect(tones(142)).toEqual([
      ["open", "done"],
      ["first-bid", "done"],
      ["live", "current"],
      ["close", "pending"],
      ["ship", "pending"],
      ["receive", "pending"],
    ]);
    expect(timelineSteps(F[142])[2].label).toBe("กำลังประมูล · ต่อเวลา 3 ครั้ง");
  });

  it("winner did not pay ends on a red step", () => {
    expect(tones(121).at(-1)).toEqual(["unpaid", "failed"]);
  });

  it("bought with buy-now skips the live step", () => {
    expect(tones(158).map(([id]) => id)).toEqual(["open", "close", "ship", "receive"]);
  });
});

describe("sellerNoticeKind", () => {
  it("live auctions only get a banner for bids that arrive while open", () => {
    expect(sellerNoticeKind(F[142], false)).toBeNull();
    expect(sellerNoticeKind(F[142], true)).toBe("NEW_BID");
    expect(sellerNoticeKind(F[150], true)).toBeNull();
  });

  it.each([
    [117, "AWAITING_PAYMENT"],
    [158, "BUY_NOW_SOLD"],
    [121, "WINNER_UNPAID"],
    [126, "NO_BIDS"],
    [133, null],
    [140, "CANCELLED"],
  ])("auction %i → %s", (id, kind) => {
    expect(sellerNoticeKind(F[id], false)).toBe(kind);
  });
});

describe("buyNowSetting", () => {
  it("shows the price, closed after the first bid, or not set", () => {
    expect(buyNowSetting(F[150])).toBe("฿3,500");
    expect(buyNowSetting(F[142])).toBe("฿12,000 · ปิดแล้ว (มีบิดแรก)");
    expect(buyNowSetting(F[126])).toBe("ไม่ได้ตั้ง");
  });
});

it("toSellerAuctionRow uses the payment deadline", () => {
  expect(toSellerAuctionRow(F[117]).deadline).toBe(F[117].paymentDueAt);
});
