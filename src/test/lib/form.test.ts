import { describe, it, expect, vi } from "vitest";
import { applyApiErrors } from "@/lib/form";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual("@/lib/api");
  return {
    ...actual,
    isApiError: vi.fn(),
  };
});

describe("applyApiErrors", () => {
  it("should return false if error is not an ApiError", () => {
    vi.mocked(api.isApiError).mockReturnValue(false);
    const setError = vi.fn();
    
    const result = applyApiErrors(new Error("Normal error"), setError);
    expect(result).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it("should set error and return true if violations exist", () => {
    vi.mocked(api.isApiError).mockReturnValue(true);
    const setError = vi.fn();
    
    const apiError = {
      code: "VALIDATION_FAILED",
      message: "Bad request",
      violations: [
        { field: "username", message: "Too short" },
      ]
    };
    
    const result = applyApiErrors(apiError, setError);
    expect(result).toBe(true);
    expect(setError).toHaveBeenCalledWith("username", { type: "server", message: "Too short" });
  });

  it("should use fieldMap when setting errors for violations", () => {
    vi.mocked(api.isApiError).mockReturnValue(true);
    const setError = vi.fn();
    
    const apiError = {
      code: "VALIDATION_FAILED",
      message: "Bad request",
      violations: [
        { field: "oldUsername", message: "Taken" },
      ]
    };
    
    const result = applyApiErrors(apiError, setError, { fieldMap: { oldUsername: "username" } });
    expect(result).toBe(true);
    expect(setError).toHaveBeenCalledWith("username", { type: "server", message: "Taken" });
  });

  it("should set error via codeToField when no violations are attached", () => {
    vi.mocked(api.isApiError).mockReturnValue(true);
    const setError = vi.fn();
    
    const apiError = {
      code: "USERNAME_TAKEN",
      message: "This username is already taken",
      violations: []
    };
    
    const result = applyApiErrors(apiError, setError, { codeToField: { USERNAME_TAKEN: "username" } });
    expect(result).toBe(true);
    expect(setError).toHaveBeenCalledWith("username", { type: "server", message: "This username is already taken" });
  });
});
