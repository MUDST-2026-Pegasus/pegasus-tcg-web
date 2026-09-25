import { describe, it, expect, vi } from "vitest";
import { buildUrl } from "@/lib/api/config";

vi.mock("@/lib/env", () => ({
  env: {
    apiBaseUrl: "http://api.example.com",
  },
}));

describe("buildUrl", () => {
  it("should build simple url without query params", () => {
    expect(buildUrl("/users")).toBe("http://api.example.com/api/v1/users");
  });

  it("should append query string correctly", () => {
    expect(buildUrl("/users", { name: "test", age: 20 })).toBe(
      "http://api.example.com/api/v1/users?name=test&age=20"
    );
  });

  it("should handle array query params correctly", () => {
    expect(buildUrl("/search", { tags: ["a", "b"] })).toBe(
      "http://api.example.com/api/v1/search?tags=a&tags=b"
    );
  });

  it("should ignore null, undefined, or empty string values", () => {
    expect(
      buildUrl("/test", {
        valid: "value",
        nullValue: null,
        undefinedValue: undefined,
        emptyStr: "",
      })
    ).toBe("http://api.example.com/api/v1/test?valid=value");
  });

  it("should ignore arrays with only empty elements", () => {
    expect(buildUrl("/test", { tags: [null, undefined, ""] })).toBe(
      "http://api.example.com/api/v1/test"
    );
  });
});
