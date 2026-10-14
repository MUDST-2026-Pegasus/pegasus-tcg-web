import { describe, expect, it } from "vitest";

import {
  formatLastLogin,
  formatThaiDate,
  pageNumbers,
  pageSummary,
  sortedRoles,
  userErrorMessage,
  userInitials,
} from "@/features/admin/users.format";
import { ApiError } from "@/lib/api";

describe("users.format", () => {
  it("shows the most powerful role first", () => {
    expect(sortedRoles(["BUYER", "SELLER", "ADMIN"])).toEqual(["ADMIN", "SELLER", "BUYER"]);
  });

  it("takes initials from the display name, falling back to the username", () => {
    expect(userInitials({ displayName: "Ton Deckbuilder", username: "ton" })).toBe("TD");
    expect(userInitials({ displayName: "", username: "kandypop" })).toBe("KA");
  });

  it("writes dates with the Buddhist year", () => {
    expect(formatThaiDate("2026-01-12T10:00:00+07:00")).toBe("12 ม.ค. 2569");
    expect(formatLastLogin(null)).toBe("ยังไม่เคยเข้าใช้");
  });

  it("summarises the rows on the current page", () => {
    expect(pageSummary(0, 20, 4982)).toBe("แสดง 1–20 จาก 4,982 บัญชี");
    expect(pageSummary(1, 20, 25)).toBe("แสดง 21–25 จาก 25 บัญชี");
    expect(pageSummary(0, 20, 0)).toBe("ไม่พบบัญชี");
  });

  it("lists every page when there are few, and skips the middle when there are many", () => {
    expect(pageNumbers(0, 3)).toEqual([0, 1, 2]);
    expect(pageNumbers(0, 250)).toEqual([0, 1, null, 249]);
    expect(pageNumbers(10, 250)).toEqual([0, null, 9, 10, 11, null, 249]);
  });

  it("explains that an admin cannot act on their own account", () => {
    const error = new ApiError({ status: 403, code: "ACCESS_DENIED", message: "x" });
    expect(userErrorMessage(error, "ลองใหม่")).toBe(
      "เปลี่ยนสถานะหรือถอนสิทธิ์ผู้ดูแลของบัญชีตัวเองไม่ได้",
    );
  });
});
