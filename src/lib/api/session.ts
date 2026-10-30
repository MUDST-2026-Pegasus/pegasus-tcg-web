import { buildUrl } from "./config";
import type { ApiEnvelope } from "./types";

const STORAGE_KEY = "pegasus.auth.session";
const EXPIRY_SKEW_MS = 30_000;

export type SessionTokens = { accessToken: string; expiresIn: number };
type StoredSession = { accessToken: string; accessExpiresAt: number };

let cached: StoredSession | null = null;
let bootstrapDone = false;
let bootstrapInFlight: Promise<void> | null = null;
let refreshInFlight: Promise<string | null> | null = null;
const listeners = new Set<() => void>();

// A previous release stored both tokens here. Removing that key is a one-time migration.
if (typeof window !== "undefined") {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
}

function notify(): void { for (const listener of listeners) listener(); }
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const channel = typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
  ? new BroadcastChannel("pegasus-auth") : null;
if (channel) {
  channel.onmessage = (event: MessageEvent<"login" | "logout" | "refreshed">) => {
    if (event.data === "logout") {
      cached = null;
      notify();
    } else if (event.data === "login" || event.data === "refreshed") {
      // The other tab cannot share its access token; obtain our own from the cookie.
      void refreshAccessToken(false);
    }
  };
}

export function getSession(): StoredSession | null { return cached; }
export function saveSession(tokens: SessionTokens, event: "login" | "refreshed" | null = "login"): void {
  cached = { accessToken: tokens.accessToken, accessExpiresAt: Date.now() + tokens.expiresIn * 1000 };
  bootstrapDone = true;
  notify();
  if (event) channel?.postMessage(event);
}
export function clearSession(announce = true): void {
  cached = null;
  bootstrapDone = true;
  notify();
  if (announce) channel?.postMessage("logout");
}
export function getAccessToken(): string | null { return cached?.accessToken ?? null; }
export function isAccessTokenExpired(): boolean {
  return cached !== null && cached.accessExpiresAt - EXPIRY_SKEW_MS <= Date.now();
}
export function isSessionBootstrapping(): boolean { return !bootstrapDone; }
export function bootstrapSession(): Promise<void> {
  if (bootstrapDone) return Promise.resolve();
  bootstrapInFlight ??= refreshAccessToken(false).then(() => {
    bootstrapDone = true;
    notify();
  });
  return bootstrapInFlight;
}

/** One request per tab and one cookie rotation at a time across tabs. */
export function refreshAccessToken(announce = true): Promise<string | null> {
  refreshInFlight ??= (async () => {
    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      return navigator.locks.request("pegasus-auth-refresh", () => runRefresh(announce));
    }
    return runRefresh(announce);
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function runRefresh(announce: boolean): Promise<string | null> {
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
  if (!response.ok) {
    clearSession(false);
    return null;
  }
  try {
    const body = (await response.json()) as ApiEnvelope<{ tokens: SessionTokens }>;
    if (!body.success || !body.data?.tokens?.accessToken) {
      clearSession(false);
      return null;
    }
    saveSession(body.data.tokens, announce ? "refreshed" : null);
    return body.data.tokens.accessToken;
  } catch {
    clearSession(false);
    return null;
  }
}
