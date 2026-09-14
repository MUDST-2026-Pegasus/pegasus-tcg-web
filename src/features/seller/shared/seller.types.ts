/** โปรไฟล์ผู้ขายที่ล็อกอินอยู่ — ใช้ทั้งใน sidebar, หน้าแดชบอร์ด และหน้าจัดการร้านค้า */
export type SellerProfile = {
  username: string;
  initials: string;
  verifiedLabel: string;
};

/** สถานะคำสั่งซื้อฝั่งผู้ขาย — ใช้ทั้งการ์ดคำสั่งซื้อล่าสุดในแดชบอร์ดและหน้าจัดการคำสั่งซื้อ */
export type OrderStatus =
  | "awaiting_pack"
  | "shipped"
  | "awaiting_payment"
  | "completed"
  | "cancelled";
