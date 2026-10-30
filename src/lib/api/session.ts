import { buildUrl } from "./config";
import type { ApiEnvelope } from "./types";

/**
 * Session state stays beside the HTTP client because it attaches bearer tokens
 * and refreshes on 401; putting it in features/auth would create an import cycle.
 */

const STORAGE_KEY = "pegasus.auth.session";
const EXPIRY_SKEW_MS = 30_000;

export type SessionTokens = { accessToken: string; expiresIn: number };
type StoredSession = { accessToken: string; accessExpiresAt: number };

let cached: StoredSession | null = null;
let sessionVersion = 0;
let bootstrapDone = false;
let bootstrapInFlight: Promise<void> | null = null;
let refreshInFlight: Promise<string | null> | null = null;
const listeners = new Set<() => void>();

// A previous release stored both tokens here. Removing that key is a one-time migration.
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be disabled; access tokens are never written there.
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const channel = typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
  ? new BroadcastChannel("pegasus-auth")
  : null;
if (channel) {
  channel.onmessage = (event: MessageEvent<"login" | "logout">) => {
    if (event.data === "logout") {
      cached = null;
      sessionVersion++;
      notify();
    } else if (event.data === "login") {
      // The other tab cannot share its access token; obtain our own from the cookie.
      void refreshAccessToken();
    }
  };
}

export function getSession(): StoredSession | null {
  return cached;
}

export function saveSession(tokens: SessionTokens, announce = true): void {
  cached = { accessToken: tokens.accessToken, accessExpiresAt: Date.now() + tokens.expiresIn * 1000 };
  sessionVersion++;
  bootstrapDone = true;
  notify();
  if (announce) channel?.postMessage("login");
}

export function clearSession(announce = true): void {
  cached = null;
  sessionVersion++;
  bootstrapDone = true;
  notify();
  if (announce) channel?.postMessage("logout");
}

export function getAccessToken(): string | null {
  return cached?.accessToken ?? null;
}

export function isAccessTokenExpired(): boolean {
  return cached !== null && cached.accessExpiresAt - EXPIRY_SKEW_MS <= Date.now();
}
export function isSessionBootstrapping(): boolean {
  return !bootstrapDone;
}

export function bootstrapSession(): Promise<void> {
  if (bootstrapDone) return Promise.resolve();
  bootstrapInFlight ??= refreshAccessToken().then(() => {
    bootstrapDone = true;
    notify();
  });
  return bootstrapInFlight;
}

/** Single-flight in this tab and one cookie rotation at a time across tabs. */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      return navigator.locks.request("pegasus-auth-refresh", runRefresh);
    }
    return runRefresh();
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function runRefresh(): Promise<string | null> {
  const startedVersion = sessionVersion;
  let response: Response;
  try {
    response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}",
    });
  } catch {
    // Keep the current access token when the network is temporarily unavailable.
    return null;
  }
  if (startedVersion !== sessionVersion) return getAccessToken();
  if (!response.ok) {
    if (response.status === 401) clearSession(false);
    return null;
  }
  try {
    const body = (await response.json()) as ApiEnvelope<{ tokens: SessionTokens }>;
    if (!body.success || !body.data?.tokens?.accessToken) {
      clearSession(false);
      return null;
    }
    saveSession(body.data.tokens, false);
    return body.data.tokens.accessToken;
  } catch {
    clearSession(false);
    return null;
  }
}
