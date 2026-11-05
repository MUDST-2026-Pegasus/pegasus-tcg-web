import { describe, expect, it } from "vitest";

import {
  type SaleRowDraft,
  applyBulkPercent,
  percentRange,
  priceFromPercent,
  rowErrors,
  rowPercent,
  sellerTakeHome,
  validateRow,
} from "@/features/seller/sales/sales.rows";

const row = (listingId: number, price: number, selected = true, salePrice: number | null = null): SaleRowDraft => ({
  listingId,
  price,
  selected,
  salePrice,
});

describe("bulk percent → per-row price (rounded to baht)", () => {
  it("matches the Figma rows at 20%", () => {
    expect(priceFromPercent(4200, 20)).toBe(3360);
    expect(priceFromPercent(1250, 20)).toBe(1000);
    expect(priceFromPercent(180, 33)).toBe(121);
  });

  it("rounds to whole baht", () => {
    expect(priceFromPercent(999, 15)).toBe(849); // 849.15
    expect(priceFromPercent(1001, 15)).toBe(851); // 850.85
    expect(priceFromPercent(99.5, 10)).toBe(90); // 89.55
  });

  it("stays at least ฿1 and below the current price", () => {
    expect(priceFromPercent(1, 50)).toBe(1);
    expect(priceFromPercent(3, 90)).toBe(1);
    expect(priceFromPercent(2, 1)).toBe(1);
  });

  it("applies only to selected rows and ignores out-of-range percents", () => {
    const rows = [row(1, 4200), row(2, 18900, false, 16500), row(3, 1250, true, 990)];
    const next = applyBulkPercent(rows, 20);
    expect(next.map((item) => item.salePrice)).toEqual([3360, 16500, 1000]);
    expect(applyBulkPercent(rows, 0)).toBe(rows);
    expect(applyBulkPercent(rows, 95)).toBe(rows);
  });
});

describe("per-row validation", () => {
  it("flags a sale price at or above the current price", () => {
    expect(validateRow(row(1, 2600, true, 2800))).toBe("not-lower");
    expect(validateRow(row(1, 2600, true, 2600))).toBe("not-lower");
  });

  it("flags missing and below ฿1", () => {
    expect(validateRow(row(1, 2600, true, null))).toBe("missing");
    expect(validateRow(row(1, 2600, true, 0))).toBe("too-low");
  });

  it("ignores rows that are not selected", () => {
    expect(validateRow(row(1, 2600, false, 9999))).toBeNull();
  });

  it("marks SALE_OVERLAP rows returned by the API", () => {
    const rows = [row(1, 4200, true, 3360), row(5, 180, true, 120), row(6, 2600, true, 2800)];
    const errors = rowErrors(rows, new Set([5]));
    expect([...errors.entries()]).toEqual([
      [5, "overlap"],
      [6, "not-lower"],
    ]);
  });
});

describe("summary helpers", () => {
  it("percent per row and range of selected rows", () => {
    expect(rowPercent(18900, 16500)).toBe(13);
    expect(rowPercent(2600, 2800)).toBeNull();
    const rows = [row(1, 4200, true, 3360), row(2, 18900, true, 16500), row(3, 180, true, 120), row(4, 100, false, 1)];
    expect(percentRange(rows)).toBe("13–33%");
  });

  it("commission is charged on the discounted price for shop sales", () => {
    expect(sellerTakeHome(4200, 3360, 0.05)).toEqual({ price: 4200, salePrice: 3360, commission: 168, net: 3192, shopDiscount: 840 });
  });
});
