import { describe, expect, it } from "vitest";

import {
  addDays,
  bangkokToday,
  EXPORT_ORDER_STATUSES,
  exportStatusFilter,
  orderExportRange,
} from "@/features/admin/orders.export";

describe("order export range [TCG-749]", () => {
  it("uses the Bangkok date, which runs 7 hours ahead of UTC", () => {
    expect(bangkokToday(new Date("2026-11-10T16:59:00Z"))).toBe("2026-11-10");
    expect(bangkokToday(new Date("2026-11-10T17:00:00Z"))).toBe("2026-11-11");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -29)).toBe("2026-01-31");
  });

  it("sends the last picked day whole: to is midnight of the next day", () => {
    expect(orderExportRange("2026-10-12", "2026-11-10")).toEqual({
      from: "2026-10-12T00:00:00+07:00",
      to: "2026-11-11T00:00:00+07:00",
    });
  });

  it("sends no status when every status is picked", () => {
    expect(exportStatusFilter(EXPORT_ORDER_STATUSES)).toEqual([]);
    expect(exportStatusFilter(["PAID", "SHIPPED"])).toEqual(["PAID", "SHIPPED"]);
  });
});
