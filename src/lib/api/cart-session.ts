const STORAGE_KEY = "pegasus.cart.session";

let cached: string | null | undefined;
const listeners = new Set<() => void>();

function generateUUID(): string {
  const c = typeof crypto !== "undefined" ? crypto : typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  throw new Error("Cryptographically secure random number generator is not available.");
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
