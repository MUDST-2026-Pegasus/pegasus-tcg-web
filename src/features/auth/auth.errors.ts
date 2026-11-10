import { isApiError, type ApiErrorCode } from "@/lib/api";
import { translate, translateError } from "@/lib/i18n";

export type AuthErrorAlert = {
  title?: string;
  description: string;
};

/**
 * Default (English) messages for auth / Google Sign-In alerts (Figma ACC-3), keyed by ApiErrorCode;
 * translated at read time from `errors:authAlert.<CODE>.title|description` [TCG-551].
 */
export const AUTH_ERROR_MESSAGES: Partial<
  Record<ApiErrorCode, { title: string; description: string }>
> = {
  GOOGLE_TOKEN_INVALID: {
    title: "Google sign-in expired",
    description: "Please continue with Google again.",
  },
  GOOGLE_EMAIL_NOT_VERIFIED: {
    title: "Google email not verified",
    description: "Verify your email with Google, then try again.",
  },
  GOOGLE_SIGNIN_NOT_ALLOWED: {
    title: "Google sign-in isn't available for this account",
    description: "Please log in with your email and password.",
  },
  GOOGLE_SIGNIN_DISABLED: {
    title: "Google sign-in is unavailable",
    description: "Please use your email and password.",
  },
  ACCOUNT_SUSPENDED: {
    title: "Account is suspended",
    description: "Please contact support for help.",
  },
  ACCOUNT_DEACTIVATED: {
    title: "Account is deactivated",
    description: "Please contact support for help.",
  },
  EMAIL_ALREADY_USED: {
    title: "This email can't be used",
    description: "Please contact support for help.",
  },
  GOOGLE_ALREADY_LINKED: {
    title: "This email is linked to another Google account",
    description: "Please contact support for help.",
  },
  GOOGLE_LINK_NOT_ALLOWED: {
    title: "Please log in with your email and password",
    description:
      "An account with this email already exists and can't be linked to Google automatically.",
  },
};

export function getAuthErrorAlert(
  error: unknown,
  fallback: string,
): AuthErrorAlert {
  if (isApiError(error)) {
    const mapped = AUTH_ERROR_MESSAGES[error.code];
    if (mapped) {
      return {
        title: translate("errors", `authAlert.${error.code}.title`, mapped.title),
        description: translate("errors", `authAlert.${error.code}.description`, mapped.description),
      };
    }
  }
  return {
    description: translateError(error, fallback),
  };
}

// key ของ translate() ด้านบน — ประกาศให้ tolgee CLI เห็น
// @tolgee-key {"key": "authAlert.GOOGLE_TOKEN_INVALID.title", "ns": "errors", "defaultValue": "Google sign-in expired"}
// @tolgee-key {"key": "authAlert.GOOGLE_TOKEN_INVALID.description", "ns": "errors", "defaultValue": "Please continue with Google again."}
// @tolgee-key {"key": "authAlert.GOOGLE_EMAIL_NOT_VERIFIED.title", "ns": "errors", "defaultValue": "Google email not verified"}
// @tolgee-key {"key": "authAlert.GOOGLE_EMAIL_NOT_VERIFIED.description", "ns": "errors", "defaultValue": "Verify your email with Google, then try again."}
// @tolgee-key {"key": "authAlert.GOOGLE_SIGNIN_NOT_ALLOWED.title", "ns": "errors", "defaultValue": "Google sign-in isn't available for this account"}
// @tolgee-key {"key": "authAlert.GOOGLE_SIGNIN_NOT_ALLOWED.description", "ns": "errors", "defaultValue": "Please log in with your email and password."}
// @tolgee-key {"key": "authAlert.GOOGLE_SIGNIN_DISABLED.title", "ns": "errors", "defaultValue": "Google sign-in is unavailable"}
// @tolgee-key {"key": "authAlert.GOOGLE_SIGNIN_DISABLED.description", "ns": "errors", "defaultValue": "Please use your email and password."}
// @tolgee-key {"key": "authAlert.ACCOUNT_SUSPENDED.title", "ns": "errors", "defaultValue": "Account is suspended"}
// @tolgee-key {"key": "authAlert.ACCOUNT_SUSPENDED.description", "ns": "errors", "defaultValue": "Please contact support for help."}
// @tolgee-key {"key": "authAlert.ACCOUNT_DEACTIVATED.title", "ns": "errors", "defaultValue": "Account is deactivated"}
// @tolgee-key {"key": "authAlert.ACCOUNT_DEACTIVATED.description", "ns": "errors", "defaultValue": "Please contact support for help."}
// @tolgee-key {"key": "authAlert.EMAIL_ALREADY_USED.title", "ns": "errors", "defaultValue": "This email can't be used"}
// @tolgee-key {"key": "authAlert.EMAIL_ALREADY_USED.description", "ns": "errors", "defaultValue": "Please contact support for help."}
// @tolgee-key {"key": "authAlert.GOOGLE_ALREADY_LINKED.title", "ns": "errors", "defaultValue": "This email is linked to another Google account"}
// @tolgee-key {"key": "authAlert.GOOGLE_ALREADY_LINKED.description", "ns": "errors", "defaultValue": "Please contact support for help."}
// @tolgee-key {"key": "authAlert.GOOGLE_LINK_NOT_ALLOWED.title", "ns": "errors", "defaultValue": "Please log in with your email and password"}
// @tolgee-key {"key": "authAlert.GOOGLE_LINK_NOT_ALLOWED.description", "ns": "errors", "defaultValue": "An account with this email already exists and can't be linked to Google automatically."}
