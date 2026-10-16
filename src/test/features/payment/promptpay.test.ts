import { describe, expect, it } from "vitest";
import { buildPromptPayPayload } from "@/features/payment/promptpay";

describe("PromptPay payload", () => {
  // CRC fixtures independently calculated with Python binascii.crc_hqx(..., 0xffff).
  it("encodes a formatted phone, dynamic amount, THB and known CRC", () => {
    expect(buildPromptPayPayload("081-234-5678", 1450)).toBe(
      "00020101021229370016A00000067701011101130066812345678530376454071450.005802TH630465F1",
    );
  });
  it("encodes a 13 digit tax ID with a known CRC", () => {
    expect(buildPromptPayPayload("1-2345-67890-12-3", 4.22)).toBe(
      "00020101021229370016A00000067701011102131234567890123530376454044.225802TH6304C92A",
    );
  });
  it("changes with the API amount", () => {
    expect(buildPromptPayPayload("0812345678", 150)).not.toBe(buildPromptPayPayload("0812345678", 151));
  });
  it.each(["", "12345", "abcdefghij", "0812345678oops", "123456789012345"])("rejects invalid ID %s", (id) => {
    expect(() => buildPromptPayPayload(id, 150)).toThrow("Invalid PromptPay ID");
  });
  it.each([0, -1, NaN, Infinity, 0.001, 10000000000])("rejects invalid amount %s", (amount) => {
    expect(() => buildPromptPayPayload("0812345678", amount)).toThrow("Invalid payment amount");
  });
});
