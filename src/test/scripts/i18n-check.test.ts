import { describe, expect, it } from "vitest";

// @ts-expect-error — สคริปต์ .mjs ไม่มี type
import { parseExtractOutput } from "../../../scripts/i18n-check.mjs";

const OUTPUT = [
  "Analyzing code...",
  "2 keys found in src/components/layout/Navbar.tsx:",
  "\tline 12: nav.home",
  "\t\tdefault: Home",
  "\tline 20: notFound.title",
  "\t\tnamespace: buyer",
  "1 warning was emitted during extraction:",
  "\tline 30: Expected source of `t` function (useTranslate or getTranslate)",
  "",
  "1 key found in src/features/x.tsx:",
  "\tline 3: errors.thing",
  "\t\tnamespace: errors",
  "Total unique keys found: 3",
].join("\n");

describe("i18n-check parseExtractOutput", () => {
  it("reads keys with their namespace (default common) and extractor warnings per file", () => {
    const { keys, warnings } = parseExtractOutput(OUTPUT);
    expect(keys).toEqual([
      { file: "src/components/layout/Navbar.tsx", line: 12, key: "nav.home", ns: "common" },
      { file: "src/components/layout/Navbar.tsx", line: 20, key: "notFound.title", ns: "buyer" },
      { file: "src/features/x.tsx", line: 3, key: "errors.thing", ns: "errors" },
    ]);
    expect(warnings).toEqual([
      { file: "src/components/layout/Navbar.tsx", line: 30, message: "Expected source of `t` function (useTranslate or getTranslate)" },
    ]);
  });
});
