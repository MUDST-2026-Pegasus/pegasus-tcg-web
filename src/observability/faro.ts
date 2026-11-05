import {
  getWebInstrumentations,
  initializeFaro,
} from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = new Set([
  "token",
  "accesstoken",
  "refreshtoken",
  "code",
  "email",
  "password",
  "bankbook",
  "account",
]);

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const JWT_PATTERN = /\beyJ[A-Z0-9_-]+\.[A-Z0-9_-]+\.[A-Z0-9_-]+\b/gi;
const BEARER_PATTERN = /\bBearer\s+[^\s,;"']+/gi;
const SENSITIVE_QUERY_PATTERN =
  /([?&])(token|access_token|refresh_token|code|email|password|bankbook|account)=([^&#\s]*)/gi;
const BANK_ACCOUNT_CONTEXT_PATTERN =
  /((?:bank\s*book|bankbook|account(?:\s*(?:number|no\.?|#))?|payment(?:\s*(?:account|number|no\.?|#))?)\s*(?:[:=#-]\s*)?)(\d{10,15})/gi;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z]/g, "");
}

function isSensitiveKey(key: string): boolean {
  const normalizedKey = normalizeKey(key);

  return (
    SENSITIVE_KEYS.has(normalizedKey) ||
    /^(?:bankbook(?:number|no|id)?|account(?:number|no|id)?|payment(?:account)?(?:number|no|id)?)$/.test(
      normalizedKey,
    )
  );
}

function sanitizeString(value: string): string {
  return value
    .replace(SENSITIVE_QUERY_PATTERN, `$1$2=${REDACTED}`)
    .replace(EMAIL_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, `Bearer ${REDACTED}`)
    .replace(JWT_PATTERN, REDACTED)
    .replace(BANK_ACCOUNT_CONTEXT_PATTERN, `$1${REDACTED}`);
}

/** Remove sensitive values from every string and sensitive-key field in a Faro event. */
export function scrubFaroEvent<T>(item: T): T {
  const visited = new WeakSet<object>();

  const scrub = (value: unknown, key?: string): unknown => {
    if (key && isSensitiveKey(key)) {
      return value == null ? value : REDACTED;
    }

    if (typeof value === "string") {
      return sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((entry) => scrub(entry));
    }

    if (value && typeof value === "object") {
      if (visited.has(value)) {
        return value;
      }
      visited.add(value);

      for (const [childKey, childValue] of Object.entries(value)) {
        (value as Record<string, unknown>)[childKey] = scrub(
          childValue,
          childKey,
        );
      }
    }

    return value;
  };

  return scrub(item) as T;
}

export type FaroClient = ReturnType<typeof initializeFaro>;

let faroClient: FaroClient | null = null;

/** Initialize Faro only for configured, non-test browser sessions. */
export function initializeFaroClient(): FaroClient | null {
  const url = import.meta.env.VITE_FARO_URL?.trim();
  const isCypress = typeof window !== "undefined" && Boolean(window.Cypress);

  if (!url || import.meta.env.MODE === "test" || isCypress) {
    return null;
  }

  if (faroClient) {
    return faroClient;
  }

  faroClient = initializeFaro({
    url,
    app: {
      name: "pegasus-web",
      version: import.meta.env.VITE_APP_VERSION || "dev",
      environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    },
    instrumentations: [
      ...getWebInstrumentations({ captureConsole: true }),
      new TracingInstrumentation({
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: [
            import.meta.env.VITE_API_BASE_URL?.trim() ||
              (import.meta.env.DEV ? "http://localhost:8080" : window.location.origin),
          ],
        },
      }),
    ],
    beforeSend: (item) => scrubFaroEvent(item),
  });

  return faroClient;
}

export function getFaroClient(): FaroClient | null {
  return faroClient;
}
