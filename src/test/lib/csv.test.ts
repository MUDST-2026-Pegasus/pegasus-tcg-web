import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/csv";

const BOM = String.fromCharCode(0xfeff);

describe("toCsv", () => {
  it("writes a BOM, CRLF and quotes every cell", () => {
    expect(toCsv([["ชื่อ", "ยอด"], ['ร้าน "ดี", จำกัด', 1500.5], [null, 0]])).toBe(
      BOM + '"ชื่อ","ยอด"\r\n"ร้าน ""ดี"", จำกัด","1500.5"\r\n"","0"',
    );
  });

  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1)", "\tx", "\rx"])(
    "prefixes the text %j so Excel does not run it as a formula",
    (text) => {
      expect(toCsv([[text]])).toBe(`${BOM}"'${text}"`);
    },
  );

  it("leaves numbers alone, so a negative amount stays a number", () => {
    expect(toCsv([[-25, -0.5, "plain-name"]])).toBe(BOM + '"-25","-0.5","plain-name"');
  });
});
