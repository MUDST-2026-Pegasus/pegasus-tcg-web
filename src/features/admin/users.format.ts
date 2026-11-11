import { hasErrorCode, isApiError } from "@/lib/api";

import type { SellerAvatarAccent } from "./admin.types";
import type { AdminUser, RoleCode, UserStatus } from "./users.types";
import { currentLanguage, formatDate, intlLocale, translate, translateError } from "@/lib/i18n";

/** ตัวช่วยแปลงข้อมูลผู้ใช้จาก `/admin/users` → ข้อความบนตาราง ไม่มีการ log PII */

export const ROLE_LABEL: Record<RoleCode, string> = {
  get BUYER() {
    return translate("admin", "users.role.buyer", "ผู้ซื้อ");
  },
  get SELLER() {
    return translate("admin", "users.role.seller", "ผู้ขาย");
  },
  get ADMIN() {
    return translate("admin", "users.role.admin", "ผู้ดูแล");
  },
  get SUPPORT() {
    return translate("admin", "users.role.support", "ทีมซัพพอร์ต");
  },
};

/** ลำดับที่โชว์ badge — บทบาทที่มีอำนาจมากกว่าขึ้นก่อน */
const ROLE_ORDER: RoleCode[] = ["ADMIN", "SUPPORT", "SELLER", "BUYER"];

export function sortedRoles(roles: RoleCode[]): RoleCode[] {
  return ROLE_ORDER.filter((role) => roles.includes(role));
}

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  get ACTIVE() {
    return translate("admin", "users.status.active", "ใช้งานปกติ");
  },
  get SUSPENDED() {
    return translate("admin", "users.status.suspended", "ถูกระงับ");
  },
  get DEACTIVATED() {
    return translate("admin", "users.status.deactivated", "ปิดบัญชี");
  },
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

/** "13 ต.ค. 2569" / "13 Oct 2026" */
export function formatThaiDate(value: string): string {
  return formatDate(value);
}

/** "0812345678" → "081-234-5678" · รูปแบบอื่นคืนตามเดิม · ไม่มี → "—" */
export function formatPhone(value: string | null): string {
  if (!value) {
    return "—";
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return value;
}

export function formatLastLogin(value: string | null): string {
  return value ? formatThaiDate(value) : translate("admin", "users.lastLogin.never", "ยังไม่เคยเข้าใช้");
}

/** "แสดง 21–40 จาก 4,982 บัญชี" — page เริ่มที่ 0 */
export function pageSummary(page: number, size: number, total: number): string {
  if (total === 0) {
    return translate("admin", "users.pageSummaryEmpty", "ไม่พบบัญชี");
  }
  const from = page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  const number = new Intl.NumberFormat(intlLocale());
  return translate("admin", "users.pageSummary", "แสดง {from}–{to} จาก {total} บัญชี", {
    from: number.format(from),
    to: number.format(to),
    total: currentLanguage() === "th" ? number.format(total) : total,
  });
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

/** 404 ของ `GET /admin/users/{id}` — ลิงก์เก่าหรือบัญชีถูกลบไปแล้ว */
export function isUserNotFound(error: unknown): boolean {
  return hasErrorCode(error, "USER_NOT_FOUND") || (isApiError(error) && error.status === 404);
}

export function userErrorMessage(error: unknown, fallback: string): string {
  if (hasErrorCode(error, "ACCESS_DENIED")) {
    return translate("admin", "users.error.accessDenied", "เปลี่ยนสถานะหรือถอนสิทธิ์ผู้ดูแลของบัญชีตัวเองไม่ได้");
  }
  if (hasErrorCode(error, "USER_NOT_FOUND")) {
    return translate("admin", "users.error.notFound", "ไม่พบบัญชีนี้แล้ว — รีเฟรชรายการให้อัตโนมัติ");
  }
  if (hasErrorCode(error, "ROLE_REQUIRES_PASSWORD")) {
    return translate("admin", "users.error.roleRequiresPassword", "บัญชีที่เข้าสู่ระบบด้วย Google อย่างเดียวไม่สามารถรับสิทธิ์ผู้ดูแลหรือทีมซัพพอร์ตได้");
  }
  return translateError(error, fallback);
}

// @tolgee-key {"key": "users.role.buyer", "ns": "admin", "defaultValue": "ผู้ซื้อ"}
// @tolgee-key {"key": "users.role.seller", "ns": "admin", "defaultValue": "ผู้ขาย"}
// @tolgee-key {"key": "users.role.admin", "ns": "admin", "defaultValue": "ผู้ดูแล"}
// @tolgee-key {"key": "users.role.support", "ns": "admin", "defaultValue": "ทีมซัพพอร์ต"}
// @tolgee-key {"key": "users.status.active", "ns": "admin", "defaultValue": "ใช้งานปกติ"}
// @tolgee-key {"key": "users.status.suspended", "ns": "admin", "defaultValue": "ถูกระงับ"}
// @tolgee-key {"key": "users.status.deactivated", "ns": "admin", "defaultValue": "ปิดบัญชี"}
// @tolgee-key {"key": "users.lastLogin.never", "ns": "admin", "defaultValue": "ยังไม่เคยเข้าใช้"}
// @tolgee-key {"key": "users.pageSummaryEmpty", "ns": "admin", "defaultValue": "ไม่พบบัญชี"}
// @tolgee-key {"key": "users.pageSummary", "ns": "admin", "defaultValue": "แสดง {from}–{to} จาก {total} บัญชี"}
// @tolgee-key {"key": "users.error.accessDenied", "ns": "admin", "defaultValue": "เปลี่ยนสถานะหรือถอนสิทธิ์ผู้ดูแลของบัญชีตัวเองไม่ได้"}
// @tolgee-key {"key": "users.error.notFound", "ns": "admin", "defaultValue": "ไม่พบบัญชีนี้แล้ว — รีเฟรชรายการให้อัตโนมัติ"}
// @tolgee-key {"key": "users.error.roleRequiresPassword", "ns": "admin", "defaultValue": "บัญชีที่เข้าสู่ระบบด้วย Google อย่างเดียวไม่สามารถรับสิทธิ์ผู้ดูแลหรือทีมซัพพอร์ตได้"}
