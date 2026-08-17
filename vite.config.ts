import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
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
});
