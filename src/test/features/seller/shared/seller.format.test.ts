import { describe, it, expect } from "vitest";
import { formatBaht } from "@/features/seller/shared/seller.format";

describe("formatBaht", () => {
  it("should format whole numbers without decimals", () => {
    expect(formatBaht(1850)).toBe("฿1,850");
    expect(formatBaht(0)).toBe("฿0");
  });

  it("should format decimal numbers with 2 decimal places", () => {
    expect(formatBaht(92.5)).toBe("฿92.50");
    expect(formatBaht(92.55)).toBe("฿92.55");
    expect(formatBaht(0.99)).toBe("฿0.99");
  });

  it("should round up/down correctly if more than 2 decimal places provided", () => {
    expect(formatBaht(92.555)).toBe("฿92.56"); // rounds up
    expect(formatBaht(92.554)).toBe("฿92.55"); // rounds down
  });
});
