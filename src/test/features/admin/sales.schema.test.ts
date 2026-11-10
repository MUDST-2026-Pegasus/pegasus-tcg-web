import { describe, expect, it } from "vitest";

import {
  getSaleErrors,
  getSaleLocks,
  slugify,
  toSaleInput,
  toSalePayload,
} from "@/features/admin/sales.schema";
import { sampleSaleCalculation } from "@/features/admin/sales.format";
import type { AdminSale, AdminSaleInput } from "@/features/admin/sales.types";

const HOUR = 3_600_000;
const start = Date.now() + 24 * HOUR;

const valid: AdminSaleInput = {
  name: "11.11 Flash Sale",
  slug: "1111-flash",
  saleType: "FLASH_SALE",
  discountType: "PERCENT",
  discountValue: 30,
  maxDiscountPerUnit: 1500,
  scopeType: "CATEGORY",
  scopeIds: [1, 2],
  conditions: ["NM"],
  minUnitPrice: 100,
  excludedSellerIds: [],
  perListingQuota: 20,
  perBuyerLimit: 1,
  budgetCap: 80_000,
  bannerImageUrl: null,
  featuredOnHome: true,
  homeSort: null,
  startsAt: new Date(start).toISOString(),
  endsAt: new Date(start + 24 * HOUR).toISOString(),
};

const existing: AdminSale = {
  ...valid,
  discountValue: 30,
  id: 7,
  slug: valid.slug,
  ownerType: "PLATFORM",
  owner: null,
  subsidyReserved: 24_300,
  soldUnits: 412,
  listingCount: 3410,
  status: "ACTIVE",
  pausedAt: null,
  pauseReason: null,
  pausedBy: null,
  createdBy: null,
  endedAt: null,
  createdAt: valid.startsAt,
  updatedAt: valid.startsAt,
};

describe("sales.schema — validation", () => {
  it("accepts a valid flash sale", () => {
    expect(getSaleErrors(valid)).toEqual({});
  });

  it("rejects a flash sale longer than 72 hours", () => {
    const errors = getSaleErrors({ ...valid, endsAt: new Date(start + 73 * HOUR).toISOString() });
    expect(errors.endsAt).toMatch(/72 ชั่วโมง/);
  });

  it("allows exactly 72 hours, and longer for a category sale", () => {
    expect(getSaleErrors({ ...valid, endsAt: new Date(start + 72 * HOUR).toISOString() })).toEqual({});
    expect(
      getSaleErrors({ ...valid, saleType: "CATEGORY_SALE", endsAt: new Date(start + 30 * 24 * HOUR).toISOString() }),
    ).toEqual({});
  });

  it.each([0, 91, 100, -5, 12.5])("rejects %s%% outside 1–90", (value) => {
    expect(getSaleErrors({ ...valid, discountValue: value }).discountValue).toMatch(/1–90/);
  });

  it.each([1, 90])("accepts %s%% on the boundary", (value) => {
    expect(getSaleErrors({ ...valid, discountValue: value }).discountValue).toBeUndefined();
  });

  it("rejects ends at or before starts", () => {
    expect(getSaleErrors({ ...valid, endsAt: valid.startsAt }).endsAt).toBe("วันสิ้นสุดต้องหลังวันเริ่ม");
    expect(
      getSaleErrors({ ...valid, endsAt: new Date(start - HOUR).toISOString() }).endsAt,
    ).toBe("วันสิ้นสุดต้องหลังวันเริ่ม");
  });

  it("requires a slug in a–z 0–9 and -", () => {
    expect(getSaleErrors({ ...valid, slug: "11.11 Flash" }).slug).toBeDefined();
    expect(getSaleErrors({ ...valid, slug: "-flash" }).slug).toBeDefined();
    expect(getSaleErrors({ ...valid, slug: "op09-launch" }).slug).toBeUndefined();
  });

  it("requires scope ids unless the scope is everything", () => {
    expect(getSaleErrors({ ...valid, scopeIds: [] }).scopeIds).toBeDefined();
    expect(getSaleErrors({ ...valid, scopeType: "ALL", scopeIds: [] }).scopeIds).toBeUndefined();
  });

  it("requires a quota per listing for flash sales only", () => {
    expect(getSaleErrors({ ...valid, perListingQuota: null }).perListingQuota).toBeDefined();
    expect(getSaleErrors({ ...valid, saleType: "CATEGORY_SALE", perListingQuota: null })).toEqual({});
  });

  it("fixed baht off must be positive", () => {
    expect(getSaleErrors({ ...valid, discountType: "FIXED_OFF", discountValue: 0 }).discountValue).toBe("ต้องมากกว่า ฿0");
    expect(getSaleErrors({ ...valid, discountType: "FIXED_OFF", discountValue: 150 })).toEqual({});
  });
});

describe("sales.schema — locked fields after orders", () => {
  it("locks everything except name, end date, budget and quota", () => {
    const locks = getSaleLocks(existing);
    expect(locks.hasOrders).toBe(true);
    for (const field of ["name", "endsAt", "budgetCap", "perListingQuota"] as const) {
      expect(locks.isLocked(field)).toBe(false);
    }
    for (const field of ["slug", "saleType", "discountType", "discountValue", "scopeType", "scopeIds", "startsAt", "perBuyerLimit"] as const) {
      expect(locks.isLocked(field)).toBe(true);
    }
  });

  it("locks nothing before the first order", () => {
    const locks = getSaleLocks({ ...existing, soldUnits: 0 });
    expect(locks.hasOrders).toBe(false);
    expect(locks.isLocked("discountValue")).toBe(false);
  });

  it("budget and quota can only grow after orders", () => {
    const input = toSaleInput(existing);
    expect(getSaleErrors({ ...input, budgetCap: 50_000 }, { existing }).budgetCap).toMatch(/เพิ่มได้อย่างเดียว/);
    expect(getSaleErrors({ ...input, perListingQuota: 10 }, { existing }).perListingQuota).toMatch(/เพิ่มได้อย่างเดียว/);
    expect(getSaleErrors({ ...input, budgetCap: 120_000, perListingQuota: 40 }, { existing })).toEqual({});
  });

  it("budget cannot go below what was already subsidised", () => {
    const fresh = { ...existing, soldUnits: 0 };
    expect(getSaleErrors({ ...toSaleInput(fresh), budgetCap: 1000 }, { existing: fresh }).budgetCap).toMatch(/ไม่น้อยกว่า/);
  });
});

describe("sales.schema — payload", () => {
  it("clears fields that do not apply to the type", () => {
    const payload = toSalePayload({
      ...valid,
      saleType: "CATEGORY_SALE",
      discountType: "FIXED_OFF",
      scopeType: "ALL",
      homeSort: 1,
    });
    expect(payload.perListingQuota).toBeNull();
    expect(payload.perBuyerLimit).toBeNull();
    expect(payload.maxDiscountPerUnit).toBeNull();
    expect(payload.scopeIds).toEqual([]);
    expect(payload.homeSort).toBe(1);
  });

  it("slugifies the campaign name", () => {
    expect(slugify("11.11 Flash Sale")).toBe("1111-flash-sale");
    expect(slugify("OP-09 Launch Week")).toBe("op-09-launch-week");
  });
});

describe("sampleSaleCalculation", () => {
  it("matches the Figma example: ฿4,200 · 30% capped at ฿1,500", () => {
    const sample = sampleSaleCalculation({ discountType: "PERCENT", discountValue: 30, maxDiscountPerUnit: 1500 });
    expect(sample).toMatchObject({ discount: 1260, buyerPays: 2940, commission: 210, sellerReceives: 3990, subsidy: 1260 });
  });

  it("applies the per-unit cap", () => {
    expect(sampleSaleCalculation({ discountType: "PERCENT", discountValue: 50, maxDiscountPerUnit: 500 }).discount).toBe(500);
  });
});
