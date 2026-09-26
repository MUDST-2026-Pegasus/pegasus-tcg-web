import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils cn()", () => {
  it("should merge tailwind classes correctly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("should handle conditional classes", () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn("p-4", isTrue && "bg-blue-500", isFalse && "text-black")).toBe("p-4 bg-blue-500");
  });

  it("should resolve tailwind conflicts using twMerge", () => {
    expect(cn("px-2 py-1 p-4")).toBe("p-4");
  });
});
