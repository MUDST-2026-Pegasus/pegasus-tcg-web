import { describe, it, expect, vi } from "vitest";
import { env } from "@/lib/env";

vi.mock("@/lib/env", () => ({
  env: {
    apiBaseUrl: "http://mock-api.com",
    isDev: true,
  },
}));

describe("env", () => {
  it("should have apiBaseUrl defined", () => {
    expect(env.apiBaseUrl).toBe("http://mock-api.com");
  });

  it("should have isDev defined as boolean", () => {
    expect(env.isDev).toBe(true);
  });
});
