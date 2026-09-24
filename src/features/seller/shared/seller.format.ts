import { initialsOf } from "@/features/account/account.format";
import type { AuthUser } from "@/features/auth/auth.types";

import type { SellerStatus } from "./seller.types";

const bahtWhole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const bahtSatang = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * ฿1,850 เมื่อเป็นจำนวนเต็ม และ ฿92.50 เมื่อมีเศษสตางค์ — ตรงกับที่ดีไซน์ใช้
 * ใช้ทั้งหน้าจัดการคำสั่งซื้อและหน้าลงขายสินค้า
 */
export function formatBaht(amount: number): string {
  const formatter = Number.isInteger(amount) ? bahtWhole : bahtSatang;
  return `฿${formatter.format(amount)}`;
}

/**
 * ชื่อและรูปของผู้ขายที่ login อยู่ — มาจากโปรไฟล์ผู้ใช้ (`useAuth()`) ไม่ใช่ `/sellers/me`
 * เพราะโปรไฟล์ผู้ใช้คือหน้าร้าน [RQ-2] `SellerProfileResponse` จึงไม่มีฟิลด์พวกนี้โดยตั้งใจ
 */
export type SellerIdentity = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  initials: string;
};

export function toSellerIdentity(user: AuthUser | null): SellerIdentity {
  if (!user) {
    return { displayName: "", username: "", avatarUrl: null, initials: "?" };
  }
  return {
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    initials: initialsOf(user.displayName),
  };
}

/** บรรทัดใต้ชื่อใน sidebar — บอกสถานะร้านจริงจาก `/sellers/me` */
export const SELLER_STATUS_LABEL: Record<SellerStatus, string> = {
  NOT_APPLIED: "ยังไม่ได้สมัครเป็นผู้ขาย",
  PENDING: "รอตรวจเอกสารยืนยันตัวตน",
  VERIFIED: "ผู้ขายที่ยืนยันแล้ว",
  REJECTED: "ยืนยันตัวตนไม่ผ่าน",
  SUSPENDED: "ร้านถูกระงับ",
};
