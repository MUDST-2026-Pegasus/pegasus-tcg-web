import { afterEach, describe, expect, it } from "vitest";

import {
  currentLanguage,
  dateFnsLocale,
  dateTimeFormat,
  formatDate,
  formatCountdown,
  formatDateTime,
  formatMonth,
  formatYear,
  formatMoney,
  formatNumber,
  formatRelative,
  intlLocale,
  numberFormat,
} from "@/lib/i18n/format";

// 19 ต.ค. 2026 14:05 เวลาไทย
const DATE = new Date("2026-10-19T07:05:00Z");

afterEach(() => {
  document.documentElement.lang = "th";
});

describe("format (th)", () => {
  it("formats money, numbers and dates in Thai with the Buddhist year", () => {
    expect(formatMoney(1234.5, { lang: "th" })).toBe("THB 1,234.50");
    expect(formatMoney(-120)).toBe("-THB 120.00");
    expect(formatNumber(1234567, undefined, "th")).toBe("1,234,567");
    expect(formatDate(DATE, undefined, "th")).toBe("19 ต.ค. 2569");
    expect(formatDateTime(DATE, undefined, "th")).toBe("19 ต.ค. 2569 14:05");
    expect(formatRelative(new Date(DATE.getTime() - 3 * 86400_000), DATE, "th")).toBe("3 วันที่ผ่านมา");
  });
});

describe("format (en)", () => {
  it("uses THB and uses en-GB dates", () => {
    expect(formatMoney(1234.5, { lang: "en" })).toBe("THB 1,234.50");
    expect(formatNumber(1234567, undefined, "en")).toBe("1,234,567");
    expect(formatDate(DATE, undefined, "en")).toBe("19 Oct 2026");
    expect(formatDateTime(DATE, undefined, "en")).toBe("19 Oct 2026, 14:05");
    expect(formatRelative(new Date(DATE.getTime() - 3 * 86400_000), DATE, "en")).toBe("3 days ago");
  });
});

describe("current language", () => {
  it("follows <html lang> so module-level formatters switch without being recreated", () => {
    const baht = numberFormat({ style: "currency", currency: "THB" });
    const month = dateTimeFormat({ month: "short", timeZone: "Asia/Bangkok" });
    expect(currentLanguage()).toBe("th");
    expect(month.format(DATE)).toBe("ต.ค.");
    expect(intlLocale()).toBe("th-TH");
    expect(intlLocale({ calendar: "gregory" })).toBe("th-TH-u-ca-gregory");
    expect(dateFnsLocale().code).toBe("th");

    document.documentElement.lang = "en";
    expect(month.format(DATE)).toBe("Oct");
    expect(baht.format(10)).toContain("10.00");
    expect(intlLocale({ calendar: "gregory" })).toBe("en-GB");
    expect(dateFnsLocale().code).toBe("en-US");
  });
});

describe("countdown, month and year", () => {
  const ms = ((3 * 24 + 4) * 3600 + 5 * 60 + 6) * 1000;
  it("formats both languages and the compact auction clock", () => {
    expect(formatCountdown(ms, {}, "th")).toBe("3 วัน 04:05:06");
    expect(formatCountdown(ms, {}, "en")).toBe("3 days 04:05:06");
    expect(formatCountdown(65_000, {}, "th")).toBe("00:01:05");
    expect(formatCountdown(65_000, { compact: true }, "th")).toBe("01:05");
    expect(formatCountdown(-1, {}, "en")).toBe("00:00:00");
  });

  it("returns the bare year (พ.ศ. in Thai) and month names", () => {
    expect(formatYear(DATE, {}, "th")).toBe("2569");
    expect(formatYear(DATE, { digits: "2-digit" }, "th")).toBe("69");
    expect(formatYear(DATE, {}, "en")).toBe("2026");
    expect(formatMonth("2026-10", "short", "th")).toBe("ต.ค.");
    expect(formatMonth("2026-10", "long", "en")).toBe("October");
  });
});
