export const env = {
  /** origin ของ backend — เบราว์เซอร์ยิงตรง (ไม่มี proxy) ปล่อยว่างจะใช้ localhost:8080 */
  apiBaseUrl: (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/+$/, ""),

  /** บัญชีร้าน Pegasus เอง — แถว Pegasus Picks ในหน้าแรกดึงหน้าร้านของบัญชีนี้ */
  pegasusStoreUsername:
    import.meta.env.VITE_PEGASUS_STORE_USERNAME || "pegasus_official",

  isDev: import.meta.env.DEV,
} as const;
