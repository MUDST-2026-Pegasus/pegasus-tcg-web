import { describe, it, expect } from "vitest";
import { env } from "@/lib/env";

describe("env", () => {
  it("should have apiBaseUrl defined", () => {
    expect(typeof env.apiBaseUrl).toBe("string");
  });

  it("should have isDev defined as boolean", () => {
    expect(typeof env.isDev).toBe("boolean");
  });
});
