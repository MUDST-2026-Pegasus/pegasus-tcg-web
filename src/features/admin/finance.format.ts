import { differenceInMinutes, format, formatDistanceToNowStrict } from "date-fns";

import { hasErrorCode } from "@/lib/api";

import type { SellerAvatarAccent } from "./admin.types";
import type { PayoutStatus, RefundStatus } from "./finance.types";
import { currentLanguage, dateFnsLocale, formatDateTime, translate, translateError, formatMoney } from "@/lib/i18n";

/** "THB 1,850.00" — ยอดในรายละเอียด */
export function formatBaht(value: number): string {
  return formatMoney(value);
}

/** "THB 1,850" — ยอดบนการ์ดคิว (ทศนิยมโผล่เฉพาะเมื่อมีสตางค์) */
export function formatBahtShort(value: number): string {
  return formatMoney(value);
}

/** "14 ต.ค. 2569 00:05" / "14 Oct 2026, 00:05" */
export function formatThaiDateTime(value: string): string {
  return formatDateTime(value);
}

/** "14 ต.ค. 00:01" — ใต้ขั้นของ timeline ที่ปีไม่จำเป็น */
export function formatThaiShortDateTime(value: string): string {
  return format(new Date(value), "d MMM HH:mm", { locale: dateFnsLocale() });
}

/** "3 นาทีที่แล้ว" */
export function formatAgo(value: string): string {
  const date = new Date(value);
  // คงรูปไทยเดิม ("3 วันที่แล้ว") — date-fns th ใส่ suffix เป็น "ที่ผ่านมา"
  return currentLanguage() === "th"
    ? translate("admin", "finance.ago", "{time}ที่แล้ว", { time: formatDistanceToNowStrict(date, { locale: dateFnsLocale("th") }) })
    : formatDistanceToNowStrict(date, { locale: dateFnsLocale("en"), addSuffix: true });
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
  PENDING: { get label() { return translate("admin", "finance.refundStatus.pending", "รอดำเนินการ"); }, badgeClass: NEUTRAL_BADGE },
  APPROVED: { get label() { return translate("admin", "finance.refundStatus.approved", "พร้อมโอน"); }, badgeClass: AMBER },
  PROCESSING: { get label() { return translate("admin", "finance.refundStatus.processing", "กำลังโอน"); }, badgeClass: BLUE },
  PROCESSED: { get label() { return translate("admin", "finance.refundStatus.processed", "โอนแล้ว"); }, badgeClass: GREEN },
  REJECTED: { get label() { return translate("admin", "finance.refundStatus.rejected", "ปฏิเสธ"); }, badgeClass: RED },
};

export const PAYOUT_STATUS_META: Record<PayoutStatus, StatusMeta> = {
  REQUESTED: { get label() { return translate("admin", "finance.payoutStatus.requested", "คำขอใหม่"); }, badgeClass: AMBER },
  APPROVED: { get label() { return translate("admin", "finance.payoutStatus.approved", "อนุมัติแล้ว · รอโอน"); }, badgeClass: PURPLE },
  PROCESSING: { get label() { return translate("admin", "finance.payoutStatus.processing", "กำลังโอน"); }, badgeClass: BLUE },
  PAID: { get label() { return translate("admin", "finance.payoutStatus.paid", "จ่ายแล้ว"); }, badgeClass: GREEN },
  REJECTED: { get label() { return translate("admin", "finance.payoutStatus.rejected", "ปฏิเสธ"); }, badgeClass: RED },
  FAILED: { get label() { return translate("admin", "finance.payoutStatus.failed", "โอนไม่สำเร็จ"); }, badgeClass: RED },
};

/** ที่มาของรายการคืนเงิน — ดูจาก resolution ของคำขอคืนสินค้า หรือการยกเลิก */
export function refundSourceLabel(resolution: string | null, returnRequestId: number | null): {
  label: string;
  badgeClass: string;
} {
  if (returnRequestId === null) {
    return { label: translate("admin", "finance.refundSource.cancel", "ยกเลิก"), badgeClass: BLUE };
  }
  if (resolution === "PARTIAL_REFUND") {
    return { label: translate("admin", "finance.refundSource.partial", "คืนบางส่วน"), badgeClass: PURPLE };
  }
  return { label: translate("admin", "finance.refundSource.full", "คืนเต็มจำนวน"), badgeClass: PURPLE };
}

export const RESOLUTION_LABEL: Record<string, string> = {
  get PARTIAL_REFUND() {
    return translate("admin", "finance.refundSource.partial", "คืนบางส่วน");
  },
  get FULL_REFUND() {
    return translate("admin", "finance.refundSource.full", "คืนเต็มจำนวน");
  },
};

/** ข้อความ error ของปุ่มการเงิน — ใช้ code จาก backend ก่อน ไม่งั้นเอาข้อความกลาง */
export function financeErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "REFUND_DESTINATION_CHANGED")) {
    return translate("admin", "finance.errors.refundDestinationChanged", "ผู้ซื้อแก้เลขบัญชีระหว่างนี้ ตรวจเลขบัญชีใหม่แล้วกรอกอีกครั้ง");
  }
  if (hasErrorCode(error, "REFUND_DESTINATION_REQUIRED")) {
    return translate("admin", "finance.errors.refundDestinationRequired", "ผู้ซื้อยังไม่ได้ระบุบัญชีรับเงินคืน");
  }
  if (hasErrorCode(error, "PAYMENT_AMOUNT_MISMATCH")) {
    return translate("admin", "finance.errors.paymentAmountMismatch", "ยอดในรายการไม่ตรงกับยอดค้างชำระของคำสั่งซื้อแล้ว");
  }
  if (hasErrorCode(error, "PAYMENT_STATE") || hasErrorCode(error, "PAYOUT_STATE")) {
    return translate("admin", "finance.errors.paymentState", "รายการนี้ถูกจัดการไปแล้ว ลองรีเฟรชคิว");
  }
  return translateError(error, fallback);
}

/** กรองรายการด้วยคำค้น — เทียบแบบไม่สนตัวพิมพ์กับทุกข้อความที่ส่งมา */
export function matchesSearch(search: string, ...values: (string | number | null | undefined)[]) {
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return values.some((value) => value != null && String(value).toLowerCase().includes(needle));
}

// @tolgee-key {"key": "finance.refundStatus.pending", "ns": "admin", "defaultValue": "รอดำเนินการ"}
// @tolgee-key {"key": "finance.refundStatus.approved", "ns": "admin", "defaultValue": "พร้อมโอน"}
// @tolgee-key {"key": "finance.refundStatus.processing", "ns": "admin", "defaultValue": "กำลังโอน"}
// @tolgee-key {"key": "finance.refundStatus.processed", "ns": "admin", "defaultValue": "โอนแล้ว"}
// @tolgee-key {"key": "finance.refundStatus.rejected", "ns": "admin", "defaultValue": "ปฏิเสธ"}
// @tolgee-key {"key": "finance.payoutStatus.requested", "ns": "admin", "defaultValue": "คำขอใหม่"}
// @tolgee-key {"key": "finance.payoutStatus.approved", "ns": "admin", "defaultValue": "อนุมัติแล้ว · รอโอน"}
// @tolgee-key {"key": "finance.payoutStatus.processing", "ns": "admin", "defaultValue": "กำลังโอน"}
// @tolgee-key {"key": "finance.payoutStatus.paid", "ns": "admin", "defaultValue": "จ่ายแล้ว"}
// @tolgee-key {"key": "finance.payoutStatus.rejected", "ns": "admin", "defaultValue": "ปฏิเสธ"}
// @tolgee-key {"key": "finance.payoutStatus.failed", "ns": "admin", "defaultValue": "โอนไม่สำเร็จ"}
// @tolgee-key {"key": "finance.refundSource.cancel", "ns": "admin", "defaultValue": "ยกเลิก"}
// @tolgee-key {"key": "finance.refundSource.partial", "ns": "admin", "defaultValue": "คืนบางส่วน"}
// @tolgee-key {"key": "finance.refundSource.full", "ns": "admin", "defaultValue": "คืนเต็มจำนวน"}
// @tolgee-key {"key": "finance.errors.refundDestinationChanged", "ns": "admin", "defaultValue": "ผู้ซื้อแก้เลขบัญชีระหว่างนี้ ตรวจเลขบัญชีใหม่แล้วกรอกอีกครั้ง"}
// @tolgee-key {"key": "finance.errors.refundDestinationRequired", "ns": "admin", "defaultValue": "ผู้ซื้อยังไม่ได้ระบุบัญชีรับเงินคืน"}
// @tolgee-key {"key": "finance.errors.paymentAmountMismatch", "ns": "admin", "defaultValue": "ยอดในรายการไม่ตรงกับยอดค้างชำระของคำสั่งซื้อแล้ว"}
// @tolgee-key {"key": "finance.errors.paymentState", "ns": "admin", "defaultValue": "รายการนี้ถูกจัดการไปแล้ว ลองรีเฟรชคิว"}
// @tolgee-key {"key": "finance.ago", "ns": "admin", "defaultValue": "{time}ที่แล้ว"}
