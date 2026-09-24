import { format } from "date-fns";
import { th } from "date-fns/locale";

import { getErrorMessage, hasErrorCode } from "@/lib/api";

import type { SellerAvatarAccent } from "./admin.types";
import type { Verification, VerificationStatus } from "./verification.types";

/**
 * ตัวช่วยแปลง `Verification` ที่ backend ส่งมา → ชิ้นส่วนที่เอาไปโชว์ได้
 * ไม่มีอะไรที่แตะ PII นอกจากจัดรูปให้อ่านง่าย — ไม่มีการ log
 */

/** locale ไทยของ date-fns ยังพิมพ์ปี ค.ศ. ต้องบวกเป็น พ.ศ. เอง */
function buddhistYear(date: Date): number {
  return date.getFullYear() + 543;
}

/** "14 ก.ย. 2569 · 10:24 น." */
export function formatThaiDateTime(value: string): string {
  const date = new Date(value);
  return `${format(date, "d MMM", { locale: th })} ${buddhistYear(date)} · ${format(date, "HH:mm")} น.`;
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
  SUBMITTED: {
    label: "รอตรวจสอบ",
    shortLabel: "รอตรวจสอบ",
    dotClass: "bg-[#b45309]",
    badgeClass: "bg-[#fdf0dd] text-[#b45309]",
  },
  UNDER_REVIEW: {
    label: "กำลังตรวจ",
    shortLabel: "กำลังตรวจ",
    dotClass: "bg-[#0058bc]",
    badgeClass: "bg-[#e8f1fc] text-[#0058bc]",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    shortLabel: "อนุมัติแล้ว",
    dotClass: "bg-[#12805c]",
    badgeClass: "bg-[#e3f4ec] text-[#12805c]",
  },
  REJECTED: {
    label: "ปฏิเสธ",
    shortLabel: "ปฏิเสธ",
    dotClass: "bg-[#d0342c]",
    badgeClass: "bg-[#fbe9e8] text-[#d0342c]",
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
  const year = buddhistYear(new Date(verification.submittedAt));
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
    return "แอดมินคนอื่นรับหรือตัดสินคำขอนี้ไปก่อนแล้ว คิวจะอัปเดตให้เอง";
  }
  if (hasErrorCode(error, "VERIFICATION_NOT_FOUND")) {
    return "ไม่พบคำขอนี้แล้ว";
  }
  return getErrorMessage(error, fallback);
}
