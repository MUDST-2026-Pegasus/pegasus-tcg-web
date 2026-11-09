import { isApiError, type ApiErrorCode } from "@/lib/api";
import { translateError } from "@/lib/i18n";

export type AuthErrorAlert = {
  title?: string;
  description: string;
};

/**
 * English error messages for auth / Google Sign-In alerts (Figma ACC-3);
 * keyed by ApiErrorCode and ready for the shared i18n layer (TCG-543).
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
      return mapped;
    }
  }
  return {
    description: translateError(error, fallback),
  };
}
