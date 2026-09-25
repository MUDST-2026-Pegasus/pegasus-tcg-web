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
  "UNSUPPORTED_FILE_TYPE",
  "FILE_TOO_LARGE",
  "FILE_NOT_FOUND",
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
  "ADDRESS_NOT_FOUND",
  "EMAIL_ALREADY_USED",
  "USERNAME_ALREADY_USED",
  "VERIFICATION_NOT_FOUND",
  "GAME_NOT_FOUND",
  "ATTRIBUTE_NOT_FOUND",
  "CATEGORY_NOT_FOUND",
  "CARD_SET_NOT_FOUND",
  "PRODUCT_NOT_FOUND",
  "VARIANT_NOT_FOUND",
  "IMAGE_NOT_FOUND",
  "VERIFICATION_ALREADY_DECIDED",
  "SELLER_NOT_FOUND",
  "SELLER_NOT_VERIFIED",
  "LISTING_NOT_FOUND",
  "LISTING_STATUS_TRANSITION",
  "LISTING_CLOSED",
  "LISTING_HAS_NO_STOCK",
  "LISTING_HAS_RESERVATIONS",
  "VARIANT_INACTIVE",
  "GAME_CODE_ALREADY_USED",
  "ATTRIBUTE_KEY_ALREADY_USED",
  "CATEGORY_CODE_ALREADY_USED",
  "CARD_SET_CODE_ALREADY_USED",
  "CARD_SET_IN_USE",
  "SKU_ALREADY_USED",
  "VARIANT_ALREADY_EXISTS",
  "IMAGE_KEY_IN_USE",
  "INVALID_ATTRIBUTE_DEFINITION",
  "INVALID_PRODUCT_ATTRIBUTES",
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
