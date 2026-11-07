import { getLanguage, translate } from "@/lib/language";
import { differenceInMinutes, format, formatDistanceToNowStrict } from "date-fns";
import { enUS, th } from "date-fns/locale";

import { getErrorMessage, hasErrorCode } from "@/lib/api";

import type { SellerAvatarAccent } from "./admin.types";
import type { PayoutStatus, RefundStatus } from "./finance.types";

/** "฿1,850.00" — ยอดในรายละเอียด */
export function formatBaht(value: number): string {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "฿1,850" — ยอดบนการ์ดคิว (ทศนิยมโผล่เฉพาะเมื่อมีสตางค์) */
export function formatBahtShort(value: number): string {
  return `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
}

/** "14 ต.ค. 2569 00:05" — date-fns ยังพิมพ์ ค.ศ. ต้องบวก 543 เอง */
export function formatThaiDateTime(value: string): string {
  const date = new Date(value);
  return `${format(date, "d MMM", { locale: getLanguage() === "th" ? th : enUS })} ${date.getFullYear() + (getLanguage() === "th" ? 543 : 0)} ${format(date, "HH:mm")}`;
}

/** "14 ต.ค. 00:01" — ใต้ขั้นของ timeline ที่ปีไม่จำเป็น */
export function formatThaiShortDateTime(value: string): string {
  return format(new Date(value), "d MMM HH:mm", { locale: getLanguage() === "th" ? th : enUS });
}

/** "3 นาทีที่แล้ว" */
export function formatAgo(value: string): string {
  return formatDistanceToNowStrict(new Date(value), { locale: getLanguage() === "th" ? th : enUS, addSuffix: true });
}

/** เหลือเวลาไม่ถึง 15 นาทีก่อนหมดเวลาชำระ — ขึ้นป้ายเตือนบนการ์ดคิว */
export function isNearDeadline(expiresAt: string, now = new Date()): boolean {
  return differenceInMinutes(new Date(expiresAt), now) < 15;
}

/** "123-4-56789-0" สำหรับเลข 10 หลัก นอกนั้นคืนตามเดิม */
export function formatAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length !== 10) {
    return accountNumber;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9)}`;
}

/** ตัวย่อสองตัวจาก username เช่น "somchai.k" → "SK", "kandypop" → "KA" */
export function initialsOf(username: string): string {
  const parts = username.split(/[._\-\s]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : username.slice(0, 2);
  return letters.toUpperCase() || "?";
}

const AVATAR_ACCENTS: SellerAvatarAccent[] = ["teal", "primary", "amber", "red", "slate"];

/** สีวงกลมตัวย่อ วนตาม id ให้แยกกันออกด้วยตา (แค่ความสวย) */
export function accentFor(id: number): SellerAvatarAccent {
  return AVATAR_ACCENTS[id % AVATAR_ACCENTS.length];
}

export type StatusMeta = {
  label: string;
  badgeClass: string;
};

export const NEUTRAL_BADGE = "bg-muted text-muted-foreground";

const AMBER = "bg-[#fdf0dd] text-[#b45309]";
const BLUE = "bg-[#e8f1fc] text-[#0058bc]";
const GREEN = "bg-[#e3f4ec] text-[#12805c]";
const RED = "bg-[#fbe9e8] text-[#d0342c]";
const PURPLE = "bg-[#f3e8ff] text-[#7e22ce]";

export const REFUND_STATUS_META: Record<RefundStatus, StatusMeta> = {
  PENDING: { get label() { return translate("รอดำเนินการ", "Pending"); }, badgeClass: NEUTRAL_BADGE },
  APPROVED: { get label() { return translate("พร้อมโอน", "Ready to transfer"); }, badgeClass: AMBER },
  PROCESSING: { get label() { return translate("กำลังโอน", "Transferring"); }, badgeClass: BLUE },
  PROCESSED: { get label() { return translate("โอนแล้ว", "Transferred"); }, badgeClass: GREEN },
  REJECTED: { get label() { return translate("ปฏิเสธ", "Reject"); }, badgeClass: RED },
};

export const PAYOUT_STATUS_META: Record<PayoutStatus, StatusMeta> = {
  REQUESTED: { get label() { return translate("คำขอใหม่", "New request"); }, badgeClass: AMBER },
  APPROVED: { get label() { return translate("อนุมัติแล้ว · รอโอน", "Approved · Awaiting transfer"); }, badgeClass: PURPLE },
  PROCESSING: { get label() { return translate("กำลังโอน", "Transferring"); }, badgeClass: BLUE },
  PAID: { get label() { return translate("จ่ายแล้ว", "Paid"); }, badgeClass: GREEN },
  REJECTED: { get label() { return translate("ปฏิเสธ", "Reject"); }, badgeClass: RED },
  FAILED: { get label() { return translate("โอนไม่สำเร็จ", "Transfer failed"); }, badgeClass: RED },
};

/** ที่มาของรายการคืนเงิน — ดูจาก resolution ของคำขอคืนสินค้า หรือการยกเลิก */
export function refundSourceLabel(resolution: string | null, returnRequestId: number | null): {
  label: string;
  badgeClass: string;
} {
  if (returnRequestId === null) {
    return { label: translate("ยกเลิก", "Cancel"), badgeClass: BLUE };
  }
  if (resolution === "PARTIAL_REFUND") {
    return { label: translate("คืนบางส่วน", "Partial refund"), badgeClass: PURPLE };
  }
  return { label: translate("คืนเต็มจำนวน", "Full refund"), badgeClass: PURPLE };
}

export const RESOLUTION_LABEL: Record<string, string> = {
  get PARTIAL_REFUND() { return translate("คืนบางส่วน", "Partial refund"); },
  get FULL_REFUND() { return translate("คืนเต็มจำนวน", "Full refund"); },
};

/** ข้อความ error ของปุ่มการเงิน — ใช้ code จาก backend ก่อน ไม่งั้นเอาข้อความกลาง */
export function financeErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "REFUND_DESTINATION_CHANGED")) {
    return translate("ผู้ซื้อแก้เลขบัญชีระหว่างนี้ ตรวจเลขบัญชีใหม่แล้วกรอกอีกครั้ง", "The buyer changed their account number. Check the new account details and enter them again");
  }
  if (hasErrorCode(error, "REFUND_DESTINATION_REQUIRED")) {
    return translate("ผู้ซื้อยังไม่ได้ระบุบัญชีรับเงินคืน", "The buyer has not provided a refund account");
  }
  if (hasErrorCode(error, "PAYMENT_AMOUNT_MISMATCH")) {
    return translate("ยอดในรายการไม่ตรงกับยอดค้างชำระของคำสั่งซื้อแล้ว", "This amount no longer matches the order's outstanding balance");
  }
  if (hasErrorCode(error, "PAYMENT_STATE") || hasErrorCode(error, "PAYOUT_STATE")) {
    return translate("รายการนี้ถูกจัดการไปแล้ว ลองรีเฟรชคิว", "This item has already been processed. Refresh the queue");
  }
  return getErrorMessage(error, fallback);
}

/** กรองรายการด้วยคำค้น — เทียบแบบไม่สนตัวพิมพ์กับทุกข้อความที่ส่งมา */
export function matchesSearch(search: string, ...values: (string | number | null | undefined)[]) {
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return values.some((value) => value != null && String(value).toLowerCase().includes(needle));
}
