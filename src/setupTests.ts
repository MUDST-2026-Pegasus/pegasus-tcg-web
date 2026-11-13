import '@testing-library/jest-dom/vitest';

// jsdom does not implement media queries. Components with responsive overlays still need the browser API.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// i18n: เทสต์เดิมที่หาด้วยข้อความไทยผ่านได้โดยไม่ต้องครอบ provider [TCG-545]
import { afterEach } from "vitest";
import { registerErrorTranslator } from "@/lib/i18n/errors";
import { prepareTestTolgee, testTolgee } from "@/test/i18n";

await prepareTestTolgee();
document.documentElement.lang = "th";

afterEach(() => {
  document.documentElement.lang = "th";
  registerErrorTranslator(testTolgee("th"));
});
