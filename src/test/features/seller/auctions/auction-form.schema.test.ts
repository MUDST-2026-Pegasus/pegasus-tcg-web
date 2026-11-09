import { describe, expect, it } from "vitest";

import type { SellerAuctionDetail } from "@/features/auction/auction.types";
import {
  auctionFormIssues,
  auctionFormSchema,
  bangkokParts,
  closeAtMs,
  closeDateRange,
  createAuctionErrorIssue,
  defaultCloseTime,
  emptyAuctionForm,
  formatCloseDate,
  formatCloseDuration,
  parseTimeInput,
  relistAuctionForm,
  shortcutCloseTime,
  toCreateAuctionPayload,
  toEndsAtIso,
} from "@/features/seller/auctions/auction-form.schema";
import type { AuctionFormValues } from "@/features/seller/auctions/auction-form.types";
import { ApiError } from "@/lib/api/errors";

/** ศ. 30 ต.ค. 2026 14:00 เวลาไทย */
const NOW = Date.parse("2026-10-30T14:00:00+07:00");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function filled(overrides: Partial<AuctionFormValues> = {}): AuctionFormValues {
  return {
    ...emptyAuctionForm(),
    unitUid: "0f9e1c2a-6b1d-4e8a-9a51-2c7d5b3e1042",
    startingPrice: "1000",
    bidIncrement: "50",
    closeDate: "2026-11-02",
    closeTime: "21:00",
    ...overrides,
  };
}

function messages(values: AuctionFormValues, now = NOW) {
  return auctionFormIssues(values, now).map((issue) => [issue.path, issue.message, issue.detail]);
}

describe("auctionFormIssues", () => {
  it("passes a complete form", () => {
    expect(auctionFormIssues(filled(), NOW)).toEqual([]);
  });

  it("asks for a card, a starting price, an increment and a close date on an empty form", () => {
    expect(messages(emptyAuctionForm())).toEqual([
      ["unitUid", "เลือกการ์ดจากสต็อกก่อน", undefined],
      ["startingPrice", "กรอกราคาเริ่มต้น", undefined],
      ["bidIncrement", "ขั้นบิดต้องมากกว่า ฿0", "กรอกขั้นบิดขั้นต่ำครั้งละ"],
      ["closeDate", "เลือกวันปิดประมูล", undefined],
    ]);
  });

  it("rejects a zero starting price", () => {
    expect(messages(filled({ startingPrice: "0" }))).toEqual([["startingPrice", "ราคาเริ่มต้นต้องมากกว่า ฿0", undefined]]);
  });

  it.each(["0", ""])("rejects an increment of %j", (bidIncrement) => {
    expect(messages(filled({ bidIncrement }))).toEqual([["bidIncrement", "ขั้นบิดต้องมากกว่า ฿0", "กรอกขั้นบิดขั้นต่ำครั้งละ"]]);
  });

  describe("buy now", () => {
    it("is ignored while the switch is off", () => {
      expect(auctionFormIssues(filled({ buyNowEnabled: false, buyNowPrice: "10" }), NOW)).toEqual([]);
    });

    it("needs a price once the switch is on", () => {
      expect(messages(filled({ buyNowEnabled: true }))).toEqual([["buyNowPrice", "กรอกราคาซื้อทันที", undefined]]);
    });

    it.each(["900", "1000"])("must be above the starting price (%s)", (buyNowPrice) => {
      const shown = buyNowPrice === "900" ? "฿900" : "฿1,000";
      expect(messages(filled({ buyNowEnabled: true, buyNowPrice }))).toEqual([
        ["buyNowPrice", "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น", `ตอนนี้ ${shown} ≤ ฿1,000`],
      ]);
    });

    it("passes when above the starting price", () => {
      expect(auctionFormIssues(filled({ buyNowEnabled: true, buyNowPrice: "1800" }), NOW)).toEqual([]);
    });
  });

  describe("close time", () => {
    it("must be at least 1 hour away", () => {
      expect(messages(filled({ closeDate: "2026-10-30", closeTime: "14:59" }))).toEqual([
        ["closeDate", "เวลาปิดเร็วเกินไป", "ต้องห่างจากตอนนี้อย่างน้อย 1 ชม."],
      ]);
      expect(auctionFormIssues(filled({ closeDate: "2026-10-30", closeTime: "15:00" }), NOW)).toEqual([]);
    });

    it("must be at most 30 days away", () => {
      expect(auctionFormIssues(filled({ closeDate: "2026-11-29", closeTime: "14:00" }), NOW)).toEqual([]);
      expect(messages(filled({ closeDate: "2026-11-29", closeTime: "14:01" }))).toEqual([
        ["closeDate", "เวลาปิดไกลเกินไป", "ตั้งได้ไม่เกิน 30 วันจากตอนนี้ (ภายใน 29 พ.ย. 2026)"],
      ]);
    });

    it("rejects a time that is not HH:mm", () => {
      expect(messages(filled({ closeTime: "25:00" }))).toEqual([
        ["closeTime", "เวลาไม่ถูกต้อง", "พิมพ์แบบ 24 ชม. เช่น 21:15"],
      ]);
      expect(messages(filled({ closeTime: "" }))[0][0]).toBe("closeTime");
    });

    it("is read as Thai time whatever the machine timezone", () => {
      expect(closeAtMs("2026-11-02", "21:00")).toBe(Date.parse("2026-11-02T14:00:00Z"));
    });
  });

  it("limits the seller note to 500 characters", () => {
    expect(auctionFormIssues(filled({ sellerNote: "ก".repeat(500) }), NOW)).toEqual([]);
    expect(messages(filled({ sellerNote: "ก".repeat(501) }))).toEqual([["sellerNote", "หมายเหตุต้องไม่เกิน 500 ตัวอักษร", undefined]]);
  });
});

describe("auctionFormSchema", () => {
  it("joins the title and detail into one message", () => {
    const result = auctionFormSchema(() => NOW).safeParse(filled({ bidIncrement: "0" }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["bidIncrement"],
      message: "ขั้นบิดต้องมากกว่า ฿0\nกรอกขั้นบิดขั้นต่ำครั้งละ",
    });
  });
});

describe("close time helpers", () => {
  it.each([
    [6, "2026-10-30", "20:00"],
    [24, "2026-10-31", "14:00"],
    [72, "2026-11-02", "14:00"],
    [168, "2026-11-06", "14:00"],
  ])("shortcut +%s hours", (hours, date, time) => {
    expect(shortcutCloseTime(NOW, hours)).toEqual({ date, time });
  });

  it.each([
    ["14:00", "15:15"],
    ["14:07", "15:30"],
    ["14:15", "15:30"],
    ["23:00", "00:15"],
  ])("default close time from %s is %s (≥ 1 ชม. 15 นาที, ทีละ 15 นาที)", (from, closeTime) => {
    const now = Date.parse(`2026-10-30T${from}:00+07:00`);
    expect(defaultCloseTime(now).closeTime).toBe(closeTime);
    expect(closeAtMs(defaultCloseTime(now).closeDate, closeTime)! - now).toBeGreaterThanOrEqual(75 * MINUTE);
  });

  it("rounds a shortcut up to the next minute", () => {
    expect(shortcutCloseTime(NOW + 30_000, 6)).toEqual({ date: "2026-10-30", time: "20:01" });
  });

  it("every shortcut passes validation", () => {
    for (const hours of [6, 24, 72, 168]) {
      const { date, time } = shortcutCloseTime(NOW, hours);
      expect(auctionFormIssues(filled({ closeDate: date, closeTime: time }), NOW)).toEqual([]);
    }
  });

  it("turns over the Thai date at midnight Bangkok, not UTC", () => {
    expect(bangkokParts(Date.parse("2026-10-30T17:30:00Z"))).toEqual({ date: "2026-10-31", time: "00:30" });
  });

  it("lets the calendar pick from today to 30 days ahead", () => {
    expect(closeDateRange(NOW)).toEqual({ first: "2026-10-30", last: "2026-11-29" });
  });

  it.each([
    ["21:15", "21:15"],
    ["9:05", "09:05"],
    ["21.15", "21:15"],
    ["2115", "21:15"],
    [" 07:30 ", "07:30"],
    ["24:00", null],
    ["21:60", null],
    ["abc", null],
    ["", null],
  ])("parses typed time %j", (typed, expected) => {
    expect(parseTimeInput(typed)).toBe(expected);
  });

  it.each([
    [3 * 24 * HOUR + 4 * HOUR + 10 * MINUTE, "3 วัน 4 ชม."],
    [7 * 24 * HOUR, "7 วัน"],
    [6 * HOUR + 30 * MINUTE, "6 ชม. 30 นาที"],
    [6 * HOUR, "6 ชม."],
    [45 * MINUTE, "45 นาที"],
  ])("formats %s ms as %j", (ms, expected) => {
    expect(formatCloseDuration(ms)).toBe(expected);
  });

  it("formats the close date with a Gregorian year", () => {
    expect(formatCloseDate("2026-11-02")).toBe("จ. 2 พ.ย. 2026");
  });
});

describe("payload", () => {
  it("sends endsAt with +07:00 and drops buy now when the switch is off", () => {
    expect(toCreateAuctionPayload(filled({ buyNowPrice: "1800", sellerNote: "  " }))).toEqual({
      unitUid: "0f9e1c2a-6b1d-4e8a-9a51-2c7d5b3e1042",
      startingPrice: 1000,
      bidIncrement: 50,
      endsAt: "2026-11-02T21:00:00+07:00",
      buyNowPrice: null,
      sellerNote: null,
    });
    expect(toEndsAtIso("2026-11-02", "21:00")).toBe("2026-11-02T21:00:00+07:00");
  });

  it("sends buy now and a trimmed note", () => {
    const payload = toCreateAuctionPayload(filled({ buyNowEnabled: true, buyNowPrice: "1800", sellerNote: " เก็บใน Top Loader " }));
    expect(payload.buyNowPrice).toBe(1800);
    expect(payload.sellerNote).toBe("เก็บใน Top Loader");
  });
});

describe("relistAuctionForm", () => {
  it("copies every field except the close time and the card", () => {
    const source = {
      startingPrice: 2400,
      bidIncrement: 100,
      buyNowPrice: 3500,
      sellerNote: "กล่องเดิม",
      endsAt: "2026-10-27T21:00:00+07:00",
    } as SellerAuctionDetail;
    expect(relistAuctionForm(source)).toEqual({
      ...emptyAuctionForm(),
      startingPrice: "2400",
      bidIncrement: "100",
      buyNowEnabled: true,
      buyNowPrice: "3500",
      sellerNote: "กล่องเดิม",
    });
  });

  it("leaves buy now off when the old auction had none", () => {
    const source = { startingPrice: 500, bidIncrement: 20, buyNowPrice: null, sellerNote: null } as SellerAuctionDetail;
    expect(relistAuctionForm(source)).toMatchObject({ buyNowEnabled: false, buyNowPrice: "", sellerNote: "" });
  });
});

describe("createAuctionErrorIssue", () => {
  const apiError = (code: string) => new ApiError({ status: 422, code, message: code });

  it.each([
    ["AUCTION_END_TOO_SOON", "closeDate", "เวลาปิดเร็วเกินไป"],
    ["AUCTION_END_TOO_FAR", "closeDate", "เวลาปิดไกลเกินไป"],
    ["BUY_NOW_BELOW_START", "buyNowPrice", "ราคาซื้อทันทีต้องสูงกว่าราคาเริ่มต้น"],
    ["UNIT_NOT_AVAILABLE", "unitUid", "การ์ดใบนี้ไม่ว่าง"],
    ["SELLER_NOT_VERIFIED", null, "ร้านยังไม่ผ่านการยืนยัน"],
  ])("maps %s", (code, path, message) => {
    expect(createAuctionErrorIssue(apiError(code), filled(), NOW)).toMatchObject({ path, message });
  });

  it("returns null for codes it does not know", () => {
    expect(createAuctionErrorIssue(apiError("SOMETHING_ELSE"), filled(), NOW)).toBeNull();
    expect(createAuctionErrorIssue(new Error("offline"), filled(), NOW)).toBeNull();
  });
});
