import { format } from "date-fns";

import { hasErrorCode } from "@/lib/api";
import { formatDate, formatYear, translate, translateError } from "@/lib/i18n";

import type { SellerAvatarAccent } from "./admin.types";
import type { Verification, VerificationStatus } from "./verification.types";

/**
 * ตัวช่วยแปลง `Verification` ที่ backend ส่งมา → ชิ้นส่วนที่เอาไปโชว์ได้
 * ไม่มีอะไรที่แตะ PII นอกจากจัดรูปให้อ่านง่าย — ไม่มีการ log
 */

/** "14 ก.ย. 2569 · 10:24 น." */
export function formatThaiDateTime(value: string): string {
  const date = new Date(value);
  return translate("admin", "verification.dateTime", "{date} · {time} น.", {
    date: formatDate(date),
    time: format(date, "HH:mm"),
  });
}

export type VerificationStatusMeta = {
  /** ชื่อสถานะบน badge/แท็บ */
  label: string;
  /** คำสั้น ๆ บนช่องสถิติ (สั้นกว่า label เพื่อให้พอดีช่อง) */
  shortLabel: string;
  /** สีจุดนำหน้าช่องสถิติ */
  dotClass: string;
  /** สีพื้น+ตัวอักษรของ badge สถานะ */
  badgeClass: string;
};

export const VERIFICATION_STATUS_META: Record<
  VerificationStatus,
  VerificationStatusMeta
> = {
  get SUBMITTED() {
    return {
      label: translate("admin", "verification.status.submitted", "รอตรวจสอบ"),
      shortLabel: translate("admin", "verification.status.submittedShort", "รอตรวจสอบ"),
      dotClass: "bg-[#b45309]",
      badgeClass: "bg-[#fdf0dd] text-[#b45309]",
    };
  },
  get UNDER_REVIEW() {
    return {
      label: translate("admin", "verification.status.underReview", "กำลังตรวจ"),
      shortLabel: translate("admin", "verification.status.underReviewShort", "กำลังตรวจ"),
      dotClass: "bg-[#0058bc]",
      badgeClass: "bg-[#e8f1fc] text-[#0058bc]",
    };
  },
  get APPROVED() {
    return {
      label: translate("admin", "verification.status.approved", "อนุมัติแล้ว"),
      shortLabel: translate("admin", "verification.status.approvedShort", "อนุมัติแล้ว"),
      dotClass: "bg-[#12805c]",
      badgeClass: "bg-[#e3f4ec] text-[#12805c]",
    };
  },
  get REJECTED() {
    return {
      label: translate("admin", "verification.status.rejected", "ปฏิเสธ"),
      shortLabel: translate("admin", "verification.status.rejectedShort", "ปฏิเสธ"),
      dotClass: "bg-[#d0342c]",
      badgeClass: "bg-[#fbe9e8] text-[#d0342c]",
    };
  },
};

/** ชุดสีวงกลมตัวย่อ วนตาม id ให้แต่ละใบสีต่างกันพอแยกออก (แค่ความสวย) */
const AVATAR_ACCENTS: SellerAvatarAccent[] = [
  "teal",
  "primary",
  "amber",
  "red",
  "slate",
];

export function avatarAccentFor(verification: Verification): SellerAvatarAccent {
  return AVATAR_ACCENTS[verification.id % AVATAR_ACCENTS.length];
}

export function legalName(verification: Verification): string {
  return `${verification.legalFirstName} ${verification.legalLastName}`.trim();
}

/** ตัวย่อจากชื่อ-นามสกุลจริง เช่น "มินตรา ทองสุข" → "มท" */
export function initialsFor(verification: Verification): string {
  const first = verification.legalFirstName.trim()[0] ?? "";
  const last = verification.legalLastName.trim()[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

/**
 * เลขบัญชีแบบเต็ม จัดกลุ่มให้อ่านง่ายเหมือนหน้าสมุดบัญชี — ไม่ปิดตัวเลข
 * เพราะงานของผู้ตรวจคือยืนยันว่าเลขบัญชีตรงกับชื่อจริง
 */
export function formatBankAccount(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length !== 10) {
    return digits || accountNumber;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
}

/** "APP-2569-0842" — เลขคำขอ นำหน้าด้วยปี พ.ศ. ที่ยื่น */
export function formatApplicationNumber(verification: Verification): string {
  const year = formatYear(verification.submittedAt, {}, "th"); // เลขคำขอใช้ พ.ศ. เสมอไม่ว่าภาษาไหน
  return `APP-${year}-${String(verification.id).padStart(4, "0")}`;
}

/**
 * ข้อความ error ของ start-review / approve / reject เป็นภาษาไทย
 * 409 คือแอดมินอีกคนขยับใบนี้ไปก่อน (backend ใช้ conditional update กันไว้)
 * ข้อความ backend เป็นภาษาอังกฤษ จึงแปลเองเฉพาะเคสที่รู้จัก
 */
export function verificationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (hasErrorCode(error, "VERIFICATION_ALREADY_DECIDED")) {
    return translate("admin", "verification.error.alreadyDecided", "แอดมินคนอื่นรับหรือตัดสินคำขอนี้ไปก่อนแล้ว คิวจะอัปเดตให้เอง");
  }
  if (hasErrorCode(error, "VERIFICATION_NOT_FOUND")) {
    return translate("admin", "verification.error.notFound", "ไม่พบคำขอนี้แล้ว");
  }
  // คำขอสองใบใช้เลขบัญชีเดียวกันรอตรวจพร้อมกันได้ ใบแรกอนุมัติไปแล้ว ใบนี้จึงอนุมัติไม่ได้อีก
  if (hasErrorCode(error, "BANK_ACCOUNT_ALREADY_USED")) {
    return translate("admin", "verification.error.bankAccountAlreadyUsed", "เลขบัญชีนี้ผูกกับร้านอื่นที่อนุมัติไปแล้ว ให้ปฏิเสธคำขอนี้พร้อมแจ้งผู้ขายยื่นใหม่ด้วยบัญชีของตัวเอง");
  }
  return translateError(error, fallback);
}

// @tolgee-key {"key": "verification.status.submitted", "ns": "admin", "defaultValue": "รอตรวจสอบ"}
// @tolgee-key {"key": "verification.status.submittedShort", "ns": "admin", "defaultValue": "รอตรวจสอบ"}
// @tolgee-key {"key": "verification.status.underReview", "ns": "admin", "defaultValue": "กำลังตรวจ"}
// @tolgee-key {"key": "verification.status.underReviewShort", "ns": "admin", "defaultValue": "กำลังตรวจ"}
// @tolgee-key {"key": "verification.status.approved", "ns": "admin", "defaultValue": "อนุมัติแล้ว"}
// @tolgee-key {"key": "verification.status.approvedShort", "ns": "admin", "defaultValue": "อนุมัติแล้ว"}
// @tolgee-key {"key": "verification.status.rejected", "ns": "admin", "defaultValue": "ปฏิเสธ"}
// @tolgee-key {"key": "verification.status.rejectedShort", "ns": "admin", "defaultValue": "ปฏิเสธ"}
// @tolgee-key {"key": "verification.error.alreadyDecided", "ns": "admin", "defaultValue": "แอดมินคนอื่นรับหรือตัดสินคำขอนี้ไปก่อนแล้ว คิวจะอัปเดตให้เอง"}
// @tolgee-key {"key": "verification.error.notFound", "ns": "admin", "defaultValue": "ไม่พบคำขอนี้แล้ว"}
// @tolgee-key {"key": "verification.error.bankAccountAlreadyUsed", "ns": "admin", "defaultValue": "เลขบัญชีนี้ผูกกับร้านอื่นที่อนุมัติไปแล้ว ให้ปฏิเสธคำขอนี้พร้อมแจ้งผู้ขายยื่นใหม่ด้วยบัญชีของตัวเอง"}
// @tolgee-key {"key": "verification.dateTime", "ns": "admin", "defaultValue": "{date} · {time} น."}
