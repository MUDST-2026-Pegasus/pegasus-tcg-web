import { describe, it, expect } from "vitest";
import {
  ApiError,
  isApiError,
  hasErrorCode,
  isNetworkError,
  getErrorMessage
} from "@/lib/api/errors";
import { CLIENT_ERROR_CODES } from "@/lib/api/types";

describe("ApiError", () => {
  it("should create an ApiError instance correctly", () => {
    const error = new ApiError({
      status: 400,
      code: "VALIDATION_ERROR" as any,
      message: "Invalid input",
      violations: [{ field: "email", message: "Invalid format" }],
      path: "/api/test",
    });

    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid input");
    expect(error.violations.length).toBe(1);
    expect(error.path).toBe("/api/test");
  });

  it("should identify ApiError using isApiError", () => {
    const apiError = new ApiError({ status: 500, code: "INTERNAL_ERROR" as any, message: "Error" });
    const normalError = new Error("Normal");

    expect(isApiError(apiError)).toBe(true);
    expect(isApiError(normalError)).toBe(false);
    expect(isApiError(null)).toBe(false);
  });

  it("should match error codes with hasErrorCode", () => {
    const apiError = new ApiError({ status: 404, code: "NOT_FOUND" as any, message: "Not found" });
    
    expect(hasErrorCode(apiError, "NOT_FOUND" as any)).toBe(true);
    expect(hasErrorCode(apiError, "INTERNAL_ERROR" as any, "NOT_FOUND" as any)).toBe(true);
    expect(hasErrorCode(apiError, "BAD_REQUEST" as any)).toBe(false);
    expect(hasErrorCode(new Error(), "NOT_FOUND" as any)).toBe(false);
  });

  it("should identify network error with isNetworkError", () => {
    const networkError = new ApiError({
      status: 0,
      code: CLIENT_ERROR_CODES.NETWORK_ERROR as any,
      message: "Network Error"
    });
    const otherError = new ApiError({ status: 500, code: "SERVER_ERROR" as any, message: "Server Error" });

    expect(isNetworkError(networkError)).toBe(true);
    expect(isNetworkError(otherError)).toBe(false);
  });

  it("should get error message using getErrorMessage", () => {
    const fallback = "Default error";
    
    expect(getErrorMessage(new ApiError({ status: 400, code: "ERR" as any, message: "API Failed" }), fallback)).toBe("API Failed");
    expect(getErrorMessage(new Error("JS Error"), fallback)).toBe("JS Error");
    expect(getErrorMessage(null, fallback)).toBe(fallback);
    expect(getErrorMessage({}, fallback)).toBe(fallback);
  });
});
