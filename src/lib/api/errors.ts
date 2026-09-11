import type { ApiErrorCode, FieldViolation } from "./types";
import { CLIENT_ERROR_CODES } from "./types";

/** ทุกความผิดพลาดที่ออกจาก `api.*` เป็น ApiError เสมอ ฝั่งเรียกจึงเช็คที่เดียวจบ */
export class ApiError extends Error {
  /** เป็น `0` เมื่อ request ไปไม่ถึง backend */
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly violations: FieldViolation[];
  readonly path?: string;

  constructor(init: {
    status: number;
    code: ApiErrorCode;
    message: string;
    violations?: FieldViolation[];
    path?: string;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.violations = init.violations ?? [];
    this.path = init.path;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function hasErrorCode(
  error: unknown,
  ...codes: ApiErrorCode[]
): error is ApiError {
  return isApiError(error) && codes.includes(error.code);
}

export function isNetworkError(error: unknown): boolean {
  return hasErrorCode(error, CLIENT_ERROR_CODES.NETWORK_ERROR);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
