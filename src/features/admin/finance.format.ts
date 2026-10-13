import { differenceInMinutes, format, formatDistanceToNowStrict } from "date-fns";
import { th } from "date-fns/locale";

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
  return `${format(date, "d MMM", { locale: th })} ${date.getFullYear() + 543} ${format(date, "HH:mm")}`;
}

/** "14 ต.ค. 00:01" — ใต้ขั้นของ timeline ที่ปีไม่จำเป็น */
export function formatThaiShortDateTime(value: string): string {
  return format(new Date(value), "d MMM HH:mm", { locale: th });
}

/** "3 นาทีที่แล้ว" */
export function formatAgo(value: string): string {
  return `${formatDistanceToNowStrict(new Date(value), { locale: th })}ที่แล้ว`;
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

export const NEUTRAL_BADGE = "bg-[#eef1f2] text-muted-foreground";

const AMBER = "bg-[#fdf0dd] text-[#b45309]";
const BLUE = "bg-[#e8f1fc] text-[#0058bc]";
const GREEN = "bg-[#e3f4ec] text-[#12805c]";
const RED = "bg-[#fbe9e8] text-[#d0342c]";
const PURPLE = "bg-[#f3e8ff] text-[#7e22ce]";

export const REFUND_STATUS_META: Record<RefundStatus, StatusMeta> = {
  PENDING: { label: "รอดำเนินการ", badgeClass: NEUTRAL_BADGE },
  APPROVED: { label: "พร้อมโอน", badgeClass: AMBER },
  PROCESSING: { label: "กำลังโอน", badgeClass: BLUE },
  PROCESSED: { label: "โอนแล้ว", badgeClass: GREEN },
  REJECTED: { label: "ปฏิเสธ", badgeClass: RED },
};

export const PAYOUT_STATUS_META: Record<PayoutStatus, StatusMeta> = {
  REQUESTED: { label: "คำขอใหม่", badgeClass: AMBER },
  APPROVED: { label: "อนุมัติแล้ว · รอโอน", badgeClass: PURPLE },
  PROCESSING: { label: "กำลังโอน", badgeClass: BLUE },
  PAID: { label: "จ่ายแล้ว", badgeClass: GREEN },
  REJECTED: { label: "ปฏิเสธ", badgeClass: RED },
  FAILED: { label: "โอนไม่สำเร็จ", badgeClass: RED },
};

/** ที่มาของรายการคืนเงิน — ดูจาก resolution ของคำขอคืนสินค้า หรือการยกเลิก */
export function refundSourceLabel(resolution: string | null, returnRequestId: number | null): {
  label: string;
  badgeClass: string;
} {
  if (returnRequestId === null) {
    return { label: "ยกเลิก", badgeClass: BLUE };
  }
  if (resolution === "PARTIAL_REFUND") {
    return { label: "คืนบางส่วน", badgeClass: PURPLE };
  }
  return { label: "คืนเต็มจำนวน", badgeClass: PURPLE };
}

export const RESOLUTION_LABEL: Record<string, string> = {
  PARTIAL_REFUND: "คืนบางส่วน",
  FULL_REFUND: "คืนเต็มจำนวน",
};

/** ข้อความ error ของปุ่มการเงิน — ใช้ code จาก backend ก่อน ไม่งั้นเอาข้อความกลาง */
export function financeErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "REFUND_DESTINATION_CHANGED")) {
    return "ผู้ซื้อแก้เลขบัญชีระหว่างนี้ ตรวจเลขบัญชีใหม่แล้วกรอกอีกครั้ง";
  }
  if (hasErrorCode(error, "REFUND_DESTINATION_REQUIRED")) {
    return "ผู้ซื้อยังไม่ได้ระบุบัญชีรับเงินคืน";
  }
  if (hasErrorCode(error, "PAYMENT_AMOUNT_MISMATCH")) {
    return "ยอดในรายการไม่ตรงกับยอดค้างชำระของคำสั่งซื้อแล้ว";
  }
  if (hasErrorCode(error, "PAYMENT_STATE") || hasErrorCode(error, "PAYOUT_STATE")) {
    return "รายการนี้ถูกจัดการไปแล้ว ลองรีเฟรชคิว";
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
