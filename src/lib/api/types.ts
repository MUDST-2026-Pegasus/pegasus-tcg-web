/**
 * ลอกมาจาก `common/ApiResponse.java`, `common/PageResponse.java`
 * และ `exception/ApiError.java` ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 */

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type FieldViolation = {
  field: string;
  message: string;
};

/** ส่งมาใน `data` ตอน `success === false` */
export type ApiErrorBody = {
  code: string;
  path?: string;
  timestamp?: string;
  violations?: FieldViolation[];
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export const API_ERROR_CODES = [
  "VALIDATION_FAILED",
  "MALFORMED_REQUEST",
  "METHOD_NOT_ALLOWED",
  "INVALID_CREDENTIALS",
  "UNAUTHENTICATED",
  "INVALID_TOKEN",
  "ACCOUNT_LOCKED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_DEACTIVATED",
  "EMAIL_NOT_VERIFIED",
  "ACCESS_DENIED",
  "USER_NOT_FOUND",
  "ROLE_NOT_FOUND",
  "RESOURCE_NOT_FOUND",
  "EMAIL_ALREADY_USED",
  "USERNAME_ALREADY_USED",
  "INTERNAL_ERROR",
] as const;

export type KnownErrorCode = (typeof API_ERROR_CODES)[number];

export const CLIENT_ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  ABORTED: "ABORTED",
  MALFORMED_RESPONSE: "MALFORMED_RESPONSE",
} as const;

export type ClientErrorCode =
  (typeof CLIENT_ERROR_CODES)[keyof typeof CLIENT_ERROR_CODES];

export type ApiErrorCode = KnownErrorCode | ClientErrorCode | (string & {});
