import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

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
    server: {
      // เปลี่ยนปลายทางได้ด้วย VITE_API_PROXY_TARGET ใน .env.local
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
          configure: (proxy) => {
            // changeOrigin แก้แค่ Host — ถ้าไม่ถอด Origin ทิ้งด้วย Spring จะตอบ 403
            // เพราะ CORS_ALLOWED_ORIGINS ไม่มี localhost:5173
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.removeHeader("origin");
            });
          },
        },
      },
    },
  };
});
