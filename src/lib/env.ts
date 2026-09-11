export const env = {
  /** dev: ปล่อยว่างให้ยิงผ่าน proxy ใน vite.config.ts · prod: ตั้งเป็น origin ของ backend */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, ""),

  isDev: import.meta.env.DEV,
} as const;
