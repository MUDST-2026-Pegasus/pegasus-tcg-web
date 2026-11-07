import { useSyncExternalStore } from "react";

export type Language = "th" | "en";
const STORAGE_KEY = "pegasus.language";
const listeners = new Set<() => void>();

function readLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "th" ? "th" : "en";
  } catch {
    return "en";
  }
}

let language = readLanguage();

export function getLanguage(): Language {
  return language;
}

export function translate(th: string, en: string): string {
  return language === "th" ? th : en;
}

export function setLanguage(next: Language) {
  language = next;
  document.documentElement.lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // The current tab can still switch language when storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    language = readLanguage();
    document.documentElement.lang = language;
    listener();
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}

export function useLanguage() {
  const current = useSyncExternalStore(subscribe, () => language);
  return { language: current, text: (th: string, en: string) => current === "th" ? th : en };
}

document.documentElement.lang = language;
