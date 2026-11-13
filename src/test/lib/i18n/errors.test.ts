import { afterEach, describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { errorText, translateError, translateViolation } from "@/lib/i18n/errors";
import { registerErrorTranslator } from "@/lib/i18n/errors";
import { testTolgee } from "@/test/i18n";

const network = new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Cannot reach the server." });

afterEach(() => registerErrorTranslator(testTolgee("th")));

describe("translateError", () => {
  it("translates a known code in Thai and English", () => {
    expect(translateError(network, "fallback")).toBe("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง");
    registerErrorTranslator(testTolgee("en"));
    expect(translateError(network, "fallback")).toBe("Can't reach the server. Check your connection and try again.");
  });

  it("falls back to the API message, then to the page fallback — never a raw key", () => {
    const unknown = new ApiError({ status: 409, code: "SOMETHING_NEW", message: "Something new happened" });
    expect(translateError(unknown, "fallback")).toBe("Something new happened");
    const empty = new ApiError({ status: 409, code: "SOMETHING_NEW", message: "" });
    expect(translateError(empty, "บันทึกไม่สำเร็จ")).toBe("บันทึกไม่สำเร็จ");
  });

  it("handles errors that are not ApiError", () => {
    expect(translateError(new Error("boom"), "fallback")).toBe("boom");
    expect(translateError("weird", "fallback")).toBe("fallback");
  });

  it("passes API details into ICU params (BID_TOO_LOW minNextBid)", () => {
    const tooLow = new ApiError({ status: 409, code: "BID_TOO_LOW", message: "Bid too low", details: { minNextBid: "THB 1,500.00" } });
    expect(translateError(tooLow, "fallback")).toBe("ต้องบิดอย่างน้อย THB 1,500.00");
    registerErrorTranslator(testTolgee("en"));
    expect(errorText("BID_TOO_LOW", { minNextBid: "THB 1,500.00" })).toBe("Your bid must be at least THB 1,500.00");
  });
});

describe("translateViolation", () => {
  it("uses validation.<code> with params when the API sends them", () => {
    expect(translateViolation({ field: "name", message: "must not be blank", code: "NotBlank" })).toBe("กรุณากรอกช่องนี้");
    expect(translateViolation({ field: "n", message: "x", code: "Max", params: { value: 34 } })).toBe("ต้องไม่เกิน 34");
  });

  it("keeps the API message when ICU params are missing", () => {
    expect(translateViolation({ field: "n", message: "size must be between 0 and 34", code: "Size", params: { max: 34 } })).toBe(
      "size must be between 0 and 34",
    );
  });

  it("keeps the API message when there is no code or no translation", () => {
    expect(translateViolation({ field: "name", message: "must not be blank" })).toBe("must not be blank");
    expect(translateViolation({ field: "name", message: "custom", code: "UnknownConstraint" })).toBe("custom");
  });
});
