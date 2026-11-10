import { initialsOf } from "@/features/account/account.format";
import type { AuthUser } from "@/features/auth/auth.types";

import type { SellerProfile, SellerStatus } from "./seller.types";
import { numberFormat, translate } from "@/lib/i18n";

const bahtWhole = numberFormat({ maximumFractionDigits: 0 });
const bahtSatang = numberFormat({
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * ฿1,850 เมื่อเป็นจำนวนเต็ม และ ฿92.50 เมื่อมีเศษสตางค์ — ตรงกับที่ดีไซน์ใช้
 * ใช้ทั้งหน้าจัดการคำสั่งซื้อและหน้าลงขายสินค้า
 */
export function formatBaht(amount: number): string {
  const formatter = Number.isInteger(amount) ? bahtWhole : bahtSatang;
  return `฿${formatter.format(amount)}`; // eslint-disable-line no-restricted-syntax -- ฿ คือสัญลักษณ์เงิน ไม่ใช่ข้อความ
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
  get NOT_APPLIED() { return translate("seller", "sellerStatus.NOT_APPLIED", "ยังไม่ได้สมัครเป็นผู้ขาย"); },
  get PENDING() { return translate("seller", "sellerStatus.PENDING", "รอตรวจเอกสารยืนยันตัวตน"); },
  get VERIFIED() { return translate("seller", "sellerStatus.VERIFIED", "ผู้ขายที่ยืนยันแล้ว"); },
  get REJECTED() { return translate("seller", "sellerStatus.REJECTED", "ยืนยันตัวตนไม่ผ่าน"); },
  get SUSPENDED() { return translate("seller", "sellerStatus.SUSPENDED", "ร้านถูกระงับ"); },
};

/**
 * ทำไมตอนนี้ลงขายหรือแก้ประกาศไม่ได้ — `null` = ทำได้
 * backend ตรวจซ้ำทุกครั้งที่เขียนอยู่แล้ว (`SELLER_NOT_VERIFIED`) ตรงนี้มีไว้บอกผู้ขายก่อนกด
 *
 * @param profile `null` = ยังไม่มี seller profile เลย
 */
export function publishBlockedReason(
  profile: SellerProfile | null,
): string | null {
  if (profile?.canPublish) {
    return null;
  }
  switch (profile?.status) {
    case "SUSPENDED":
      return translate("seller", "publishBlocked.suspended", "ร้านถูกระงับ ลงขายหรือแก้ประกาศไม่ได้จนกว่าแอดมินจะยกเลิกการระงับ");
    case "PENDING":
      return translate("seller", "publishBlocked.pending", "รอแอดมินตรวจเอกสารยืนยันตัวตน ลงขายได้หลังได้รับอนุมัติ");
    case "REJECTED":
      return translate("seller", "publishBlocked.rejected", "เอกสารยืนยันตัวตนไม่ผ่าน ต้องยื่นใหม่และได้รับอนุมัติก่อนจึงจะลงขายได้");
    default:
      return translate("seller", "publishBlocked.notVerified", "ต้องยืนยันตัวตนผู้ขายก่อนจึงจะลงขายได้");
  }
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "sellerStatus.NOT_APPLIED", "ns": "seller", "defaultValue": "ยังไม่ได้สมัครเป็นผู้ขาย"}
// @tolgee-key {"key": "sellerStatus.PENDING", "ns": "seller", "defaultValue": "รอตรวจเอกสารยืนยันตัวตน"}
// @tolgee-key {"key": "sellerStatus.VERIFIED", "ns": "seller", "defaultValue": "ผู้ขายที่ยืนยันแล้ว"}
// @tolgee-key {"key": "sellerStatus.REJECTED", "ns": "seller", "defaultValue": "ยืนยันตัวตนไม่ผ่าน"}
// @tolgee-key {"key": "sellerStatus.SUSPENDED", "ns": "seller", "defaultValue": "ร้านถูกระงับ"}
// @tolgee-key {"key": "publishBlocked.suspended", "ns": "seller", "defaultValue": "ร้านถูกระงับ ลงขายหรือแก้ประกาศไม่ได้จนกว่าแอดมินจะยกเลิกการระงับ"}
// @tolgee-key {"key": "publishBlocked.pending", "ns": "seller", "defaultValue": "รอแอดมินตรวจเอกสารยืนยันตัวตน ลงขายได้หลังได้รับอนุมัติ"}
// @tolgee-key {"key": "publishBlocked.rejected", "ns": "seller", "defaultValue": "เอกสารยืนยันตัวตนไม่ผ่าน ต้องยื่นใหม่และได้รับอนุมัติก่อนจึงจะลงขายได้"}
// @tolgee-key {"key": "publishBlocked.notVerified", "ns": "seller", "defaultValue": "ต้องยืนยันตัวตนผู้ขายก่อนจึงจะลงขายได้"}
