import type { SellerProfile } from "./seller.types";

/**
 * ข้อมูลผู้ขายตัวอย่าง — ยังเป็นข้อมูลจำลองทั้งหมด
 * เมื่อต่อ API auth จริงแล้วให้แก้เฉพาะข้างใน getSellerProfile()
 * ส่วนที่เรียกใช้ (sidebar / หน้าต่าง ๆ) ไม่ต้องแก้เลย
 */
const SELLER_PROFILE_MOCK: SellerProfile = {
  username: "minmin_tcg",
  initials: "MM",
  verifiedLabel: "ผู้ขายที่ยืนยันแล้ว",
};

export function getSellerProfile(): SellerProfile {
  return SELLER_PROFILE_MOCK;
}
