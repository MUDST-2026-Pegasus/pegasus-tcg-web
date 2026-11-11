import { describe, expect, it } from "vitest";

import {
  formatLastLogin,
  formatPhone,
  formatThaiDate,
  isUserNotFound,
  pageNumbers,
  pageSummary,
  sortedRoles,
  userErrorMessage,
  userInitials,
} from "@/features/admin/users.format";
import { ApiError } from "@/lib/api";
import { registerErrorTranslator } from "@/lib/i18n/errors";
import { testTolgee } from "@/test/i18n";

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

  it("groups Thai phone numbers and shows a dash when missing", () => {
    expect(formatPhone("0812345678")).toBe("081-234-5678");
    expect(formatPhone("021234567")).toBe("02-123-4567");
    expect(formatPhone("+66 81 234 5678")).toBe("+66 81 234 5678");
    expect(formatPhone(null)).toBe("—");
  });

  it("recognises a missing account", () => {
    expect(isUserNotFound(new ApiError({ status: 404, code: "USER_NOT_FOUND", message: "" }))).toBe(true);
    expect(isUserNotFound(new ApiError({ status: 500, code: "HTTP_500", message: "" }))).toBe(false);
  });

  it("summarises the rows on the current page", () => {
    expect(pageSummary(0, 20, 4982)).toBe("แสดง 1–20 จาก 4,982 บัญชี");
    expect(pageSummary(1, 20, 25)).toBe("แสดง 21–25 จาก 25 บัญชี");
    expect(pageSummary(0, 20, 0)).toBe("ไม่พบบัญชี");
  });

  it("summarises the rows in English with ICU plural support", () => {
    document.documentElement.lang = "en";
    registerErrorTranslator(testTolgee("en"));
    try {
      expect(pageSummary(0, 20, 1)).toBe("Showing 1–1 of 1 account");
      expect(pageSummary(0, 20, 2)).toBe("Showing 1–2 of 2 accounts");
      expect(pageSummary(0, 20, 4982)).toBe("Showing 1–20 of 4,982 accounts");
      expect(pageSummary(0, 20, 0)).toBe("No accounts found");
    } finally {
      document.documentElement.lang = "th";
      registerErrorTranslator(testTolgee("th"));
    }
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

  it("explains when granting a privileged role fails with ROLE_REQUIRES_PASSWORD", () => {
    const error = new ApiError({
      status: 409,
      code: "ROLE_REQUIRES_PASSWORD",
      message: "Role requires password",
    });
    expect(userErrorMessage(error, "ลองใหม่")).toBe(
      "บัญชีที่เข้าสู่ระบบด้วย Google อย่างเดียวไม่สามารถรับสิทธิ์ผู้ดูแลหรือทีมซัพพอร์ตได้",
    );
  });
});
