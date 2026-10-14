import { describe, it, expect } from "vitest";
import { verificationErrorMessage } from "@/features/admin/verification.format";
import { ApiError } from "@/lib/api";

function apiError(status: number, code: string, message: string) {
  return new ApiError({ status, code, message });
}

describe("verificationErrorMessage", () => {
  it("explains an account already approved for another seller, and what to do about it", () => {
    const error = apiError(
      409,
      "BANK_ACCOUNT_ALREADY_USED",
      "This bank account was approved for another seller after this request was filed",
    );

    expect(verificationErrorMessage(error, "ลองใหม่อีกครั้ง")).toBe(
      "เลขบัญชีนี้ผูกกับร้านอื่นที่อนุมัติไปแล้ว ให้ปฏิเสธคำขอนี้พร้อมแจ้งผู้ขายยื่นใหม่ด้วยบัญชีของตัวเอง",
    );
  });

  it("says another admin got there first when the request was already decided", () => {
    const error = apiError(409, "VERIFICATION_ALREADY_DECIDED", "already decided");

    expect(verificationErrorMessage(error, "ลองใหม่อีกครั้ง")).toBe(
      "แอดมินคนอื่นรับหรือตัดสินคำขอนี้ไปก่อนแล้ว คิวจะอัปเดตให้เอง",
    );
  });

  it("falls back to the backend's own message for codes it does not know", () => {
    const error = apiError(500, "INTERNAL_ERROR", "Unexpected server error");

    expect(verificationErrorMessage(error, "ลองใหม่อีกครั้ง")).toBe("Unexpected server error");
  });
});
