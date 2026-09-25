export const env = {
  /** dev: ปล่อยว่างให้ยิงผ่าน proxy ใน vite.config.ts · prod: ตั้งเป็น origin ของ backend */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, ""),

  /** บัญชีร้าน Pegasus เอง — แถว Pegasus Picks ในหน้าแรกดึงหน้าร้านของบัญชีนี้ */
  pegasusStoreUsername:
    import.meta.env.VITE_PEGASUS_STORE_USERNAME || "pegasus_official",

  isDev: import.meta.env.DEV,
} as const;
