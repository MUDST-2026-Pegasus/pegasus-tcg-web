import { buildUrl } from "./config";
import type { ApiEnvelope } from "./types";

/**
 * อยู่ในชั้น HTTP ไม่ใช่ `features/auth` เพราะ `client.ts` ต้องใช้ตอนแนบ header
 * และตอนเจอ 401 — ถ้าไปไว้ใน feature จะ import วนกัน
 */

const STORAGE_KEY = "pegasus.auth.session";

const EXPIRY_SKEW_MS = 30_000;

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
};

let cached: StoredSession | null | undefined;

const listeners = new Set<() => void>();

function readStorage(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed?.accessToken || !parsed?.refreshToken) {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      accessExpiresAt: parsed.accessExpiresAt ?? 0,
    };
  } catch {
    return null;
  }
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getSession(): StoredSession | null {
  if (cached === undefined) {
    cached = readStorage();
  }
  return cached;
}

export function saveSession(tokens: SessionTokens): void {
  const next: StoredSession = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExpiresAt: Date.now() + tokens.expiresIn * 1000,
  };
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // เขียนไม่ได้ก็ยังใช้ต่อในแท็บนี้ได้ แค่ไม่ค้างข้ามการรีเฟรช
  }
  notify();
}

export function clearSession(): void {
  cached = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // เช่นเดียวกับ saveSession
  }
  notify();
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getSession()?.refreshToken ?? null;
}

export function isAccessTokenExpired(): boolean {
  const session = getSession();
  if (!session) {
    return false;
  }
  return session.accessExpiresAt - EXPIRY_SKEW_MS <= Date.now();
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * รวมเป็นคำขอเดียวเสมอ — หลาย request ที่เจอ 401 พร้อมกันรอผลอันเดียวกัน
 * ไม่แย่งกันหมุน refresh token ที่ใช้ได้ครั้งเดียว
 */
export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function runRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // เน็ตหลุด — ยังไม่ล้าง session เพราะ refresh token อาจยังใช้ได้อยู่
    return null;
  }

  if (!response.ok) {
    // refresh token หมดอายุหรือถูกใช้ไปแล้ว ล้างทิ้งให้ผู้ใช้ login ใหม่
    clearSession();
    return null;
  }

  try {
    const body = (await response.json()) as ApiEnvelope<{ tokens: SessionTokens }>;
    if (!body.success || !body.data?.tokens?.accessToken) {
      clearSession();
      return null;
    }
    saveSession(body.data.tokens);
    return body.data.tokens.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) {
      return;
    }
    cached = readStorage();
    notify();
  });
}
