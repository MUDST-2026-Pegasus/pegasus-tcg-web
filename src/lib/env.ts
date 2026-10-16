export const env = {
  /**
   * origin ของ backend — เบราว์เซอร์ยิงตรง (ไม่มี proxy) ปล่อยว่าง:
   * - `pnpm dev` ใช้ localhost:8080
   * - production build ใช้ origin เดียวกับหน้าเว็บ ("" → `/api/...`) เพราะ
   *   Ingress ส่ง /api ไปหา api ให้ — image เดียวใช้ได้ทุกโดเมน/IP
   */
  apiBaseUrl: (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:8080" : "")
  ).replace(/\/+$/, ""),

  /** บัญชีร้าน Pegasus เอง — แถว Pegasus Picks ในหน้าแรกดึงหน้าร้านของบัญชีนี้ */
  pegasusStoreUsername:
    import.meta.env.VITE_PEGASUS_STORE_USERNAME || "pegasus_official",

  isDev: import.meta.env.DEV,
} as const;
