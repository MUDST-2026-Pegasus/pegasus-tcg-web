import { describe, expect, it } from "vitest";

import {
  changedPromotionFields,
  getPromotionErrors,
  getPromotionLocks,
  toPromotionInput,
  toPromotionPayload,
} from "@/features/admin/promotions.schema";
import type { AdminPromotion, AdminPromotionInput } from "@/features/admin/promotions.types";

const DAY = 86_400_000;

const valid: AdminPromotionInput = {
  code: "PEGASUS10",
  name: "Weekend",
  description: null,
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 200,
  minSpend: 500,
  scopeType: "ALL",
  scopeIds: [],
  visibility: "PUBLIC",
  newBuyerOnly: false,
  usageLimitTotal: 100,
  usageLimitPerUser: 1,
  startsAt: new Date(Date.now() + DAY).toISOString(),
  endsAt: new Date(Date.now() + 30 * DAY).toISOString(),
  claimable: true,
  claimRequired: false,
  claimLimit: 100,
  featuredOnHome: true,
  homeSort: null,
};

const existing: AdminPromotion = {
  ...valid,
  id: 1,
  ownerType: "PLATFORM",
  owner: null,
  usedCount: 10,
  claimedCount: 8,
  status: "ACTIVE",
  pausedAt: null,
  pauseReason: null,
  createdAt: valid.startsAt,
  updatedAt: valid.startsAt,
  createdBy: null,
  pausedBy: null,
  discountTotal: 0,
  salesTotal: 0,
  reservedOrders: 0,
};

describe("promotion form schema", () => {
  it("accepts a valid code", () => {
    expect(getPromotionErrors(valid)).toEqual({});
  });

  it("accepts only positions in the eight-code home strip", () => {
    expect(getPromotionErrors({ ...valid, homeSort: 7 })).toEqual({});
    expect(getPromotionErrors({ ...valid, homeSort: 8 }).homeSort).toBeTruthy();
  });

  it("keeps a percentage between 1 and 90 and the end after the start", () => {
    expect(getPromotionErrors({ ...valid, discountValue: 0 }).discountValue).toBe("เปอร์เซ็นต์ต้องอยู่ระหว่าง 1–90");
    const errors = getPromotionErrors({ ...valid, discountValue: 91, endsAt: new Date(Date.now() - DAY).toISOString() });
    expect(errors.discountValue).toBeTruthy();
    expect(errors.endsAt).toBe("วันสิ้นสุดต้องหลังวันเริ่ม");
  });

  it("answers an emptied number field in Thai", () => {
    const errors = getPromotionErrors({ ...valid, minSpend: null as unknown as number });
    expect(errors.minSpend).toBe("กรอกยอดขั้นต่ำ (ใส่ 0 ถ้าไม่มี)");
  });

  it("refuses a ninth code on the home page", () => {
    expect(getPromotionErrors(valid, { featuredCount: 8 }).featuredOnHome).toMatch(/ครบ 8/);
    expect(getPromotionErrors(valid, { featuredCount: 8, existing: { ...existing, featuredOnHome: true } })).toEqual({});
  });

  it("keeps usage at or above used_count and claims at or above claimed_count while editing", () => {
    const errors = getPromotionErrors(
      { ...valid, usageLimitTotal: 9, claimLimit: 7 },
      { existing: { usedCount: 10, claimedCount: 8 } },
    );
    expect(errors.usageLimitTotal).toBe("ต้องไม่ต่ำกว่าที่ใช้ไปแล้ว (10)");
    expect(errors.claimLimit).toBe("ต้องไม่ต่ำกว่าที่เก็บไปแล้ว (8)");
  });

  it("rejects lowering limits, an earlier end or a new claim rule after orders and claims", () => {
    const errors = getPromotionErrors(
      { ...valid, usageLimitTotal: 50, claimLimit: 50, claimRequired: true, endsAt: new Date(Date.now() + 10 * DAY).toISOString() },
      { existing },
    );
    expect(errors.usageLimitTotal).toBeTruthy();
    expect(errors.claimLimit).toBeTruthy();
    expect(errors.claimRequired).toBeTruthy();
    expect(errors.endsAt).toBe("หลังมีการใช้โค้ดแล้ว ยืดวันสิ้นสุดได้อย่างเดียว");
  });

  it("treats a limit set on an unlimited code as lowering it", () => {
    const unlimited = { ...existing, usageLimitTotal: null };
    expect(getPromotionErrors({ ...valid, usageLimitTotal: 1000 }, { existing: unlimited }).usageLimitTotal).toBeTruthy();
    expect(getPromotionErrors({ ...valid, usageLimitTotal: null }, { existing: unlimited })).toEqual({});
  });

  it("locks the fields the backend refuses after use, and only the claim rule after claims", () => {
    const used = getPromotionLocks({ usedCount: 1, claimedCount: 0 });
    expect(used.isLocked("discountValue")).toBe(true);
    expect(used.isLocked("endsAt")).toBe(false);
    expect(used.isLocked("usageLimitTotal")).toBe(false);
    const claimed = getPromotionLocks({ usedCount: 0, claimedCount: 3 });
    expect(claimed.isLocked("claimRequired")).toBe(true);
    expect(claimed.isLocked("discountValue")).toBe(false);
  });
});

describe("promotion payload", () => {
  it("clears fields that mean nothing for the discount type or visibility", () => {
    expect(toPromotionPayload({ ...valid, discountType: "FIXED" }).maxDiscount).toBeNull();
    expect(toPromotionPayload({ ...valid, discountType: "FREE_SHIPPING" }).discountValue).toBe(0);
    expect(toPromotionPayload({ ...valid, visibility: "PRIVATE", homeSort: 2 })).toMatchObject({
      claimable: false,
      claimRequired: false,
      claimLimit: null,
      featuredOnHome: false,
      homeSort: null,
    });
    expect(toPromotionPayload({ ...valid, code: " pegasus10 ", description: "  " })).toMatchObject({
      code: "PEGASUS10",
      description: null,
    });
  });

  it("lists only the fields that really changed", () => {
    const input = toPromotionInput(existing);
    expect(changedPromotionFields(existing, { ...input, endsAt: new Date(Date.parse(existing.endsAt)).toISOString() })).toEqual([]);
    expect(changedPromotionFields(existing, { ...input, name: "New", usageLimitTotal: 200 })).toEqual(["name", "usageLimitTotal"]);
  });
});
