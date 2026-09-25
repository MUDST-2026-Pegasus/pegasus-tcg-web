const STORAGE_KEY = "pegasus.cart.session";

let cached: string | null | undefined;
const listeners = new Set<() => void>();

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readStorage(): string | null {
  try {
    // Purge any legacy localStorage entry
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getCartSession(): string | null {
  if (cached === undefined) {
    cached = readStorage();
  }
  return cached;
}

export function getOrCreateCartSession(): string {
  let session = getCartSession();
  if (!session) {
    session = generateUUID();
    setCartSession(session);
  }
  return session;
}

export function setCartSession(sessionKey: string): void {
  if (!sessionKey || sessionKey === cached) return;
  cached = sessionKey;
  try {
    sessionStorage.setItem(STORAGE_KEY, sessionKey);
  } catch {
    // ignore
  }
  notify();
}

export function clearCartSession(): void {
  cached = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  notify();
}

export function subscribeCartSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
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
