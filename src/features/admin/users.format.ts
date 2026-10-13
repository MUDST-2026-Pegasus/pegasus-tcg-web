import { format } from "date-fns";
import { th } from "date-fns/locale";

import { getErrorMessage, hasErrorCode } from "@/lib/api";

import type { SellerAvatarAccent } from "./admin.types";
import type { AdminUser, RoleCode, UserStatus } from "./users.types";

/** ตัวช่วยแปลงข้อมูลผู้ใช้จาก `/admin/users` → ข้อความบนตาราง ไม่มีการ log PII */

export const ROLE_LABEL: Record<RoleCode, string> = {
  BUYER: "ผู้ซื้อ",
  SELLER: "ผู้ขาย",
  ADMIN: "ผู้ดูแล",
  SUPPORT: "ทีมซัพพอร์ต",
};

/** ลำดับที่โชว์ badge — บทบาทที่มีอำนาจมากกว่าขึ้นก่อน */
const ROLE_ORDER: RoleCode[] = ["ADMIN", "SUPPORT", "SELLER", "BUYER"];

export function sortedRoles(roles: RoleCode[]): RoleCode[] {
  return ROLE_ORDER.filter((role) => roles.includes(role));
}

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "ใช้งานปกติ",
  SUSPENDED: "ถูกระงับ",
  DEACTIVATED: "ปิดบัญชี",
};

/** ตัวย่อจากชื่อที่แสดง (ไม่มีก็ใช้ username) เช่น "Ton Deckbuilder" → "TD" */
export function userInitials(user: Pick<AdminUser, "displayName" | "username">): string {
  const words = (user.displayName || user.username).trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

const ACCENTS: SellerAvatarAccent[] = ["teal", "primary", "amber", "red", "slate"];

/** สีวงกลมตัวย่อ วนตาม id (แค่ความสวย) */
export function userAccent(user: Pick<AdminUser, "id">): SellerAvatarAccent {
  return ACCENTS[user.id % ACCENTS.length];
}

/** "12 ม.ค. 2569" — locale ไทยของ date-fns ยังพิมพ์ปี ค.ศ. ต้องบวกเป็น พ.ศ. เอง */
export function formatThaiDate(value: string): string {
  const date = new Date(value);
  return `${format(date, "d MMM", { locale: th })} ${date.getFullYear() + 543}`;
}

export function formatLastLogin(value: string | null): string {
  return value ? formatThaiDate(value) : "ยังไม่เคยเข้าใช้";
}

/** "แสดง 21–40 จาก 4,982 บัญชี" — page เริ่มที่ 0 */
export function pageSummary(page: number, size: number, total: number): string {
  if (total === 0) {
    return "ไม่พบบัญชี";
  }
  const from = page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  const number = new Intl.NumberFormat("th-TH");
  return `แสดง ${number.format(from)}–${number.format(to)} จาก ${number.format(total)} บัญชี`;
}

/**
 * เลขหน้าที่จะโชว์ (เริ่มที่ 0) — หน้าแรก หน้าสุดท้าย และรอบ ๆ หน้าปัจจุบัน
 * `null` แทนช่องว่างที่ข้ามไป ("…")
 */
export function pageNumbers(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }
  const shown = new Set([0, totalPages - 1, page - 1, page, page + 1]);
  const pages = [...shown]
    .filter((value) => value >= 0 && value < totalPages)
    .sort((a, b) => a - b);
  const result: (number | null)[] = [];
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) {
      result.push(null);
    }
    result.push(value);
  });
  return result;
}

export function userErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "ACCESS_DENIED")) {
    return "เปลี่ยนสถานะหรือถอนสิทธิ์ผู้ดูแลของบัญชีตัวเองไม่ได้";
  }
  if (hasErrorCode(error, "USER_NOT_FOUND")) {
    return "ไม่พบบัญชีนี้แล้ว";
  }
  return getErrorMessage(error, fallback);
}
