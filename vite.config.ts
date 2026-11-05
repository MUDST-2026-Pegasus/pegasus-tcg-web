/// <reference types="vitest" />
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// Cloudflare Workers Builds ใส่ WORKERS_CI_BRANCH ตอน build — VITE_* ถูกฝังตอน build
// จึงต้องเลือก API ตาม branch ที่นี่ (vars ใน wrangler เป็น runtime ใช้กับ SPA ไม่ได้)
// ตั้ง VITE_API_BASE_URL เองใน build variables = override ทับค่านี้
const PROD_BRANCH = "main";
const API_BY_ENV = {
  production: "https://pegasus-tcg.gameinwza.com",
  preview: "https://pegasus-dev.gameinwza.com",
};
const ciBranch = process.env.WORKERS_CI_BRANCH;
if (ciBranch && !process.env.VITE_API_BASE_URL) {
  process.env.VITE_API_BASE_URL =
    ciBranch === PROD_BRANCH ? API_BY_ENV.production : API_BY_ENV.preview;
}

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    resolve: {
      alias: {
        // "@" ชี้ไปที่ src/ — ต้องตรงกับ paths ใน tsconfig.app.json
        // และ aliases ใน components.json เสมอ
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      reporters: ['default', 'junit', 'html'],
      outputFile: {
        junit: './test-results/junit.xml',
        html: './test-results/html/index.html'
      },
    },
  };
});
