import type { AuthUser } from "@/features/auth/auth.types";

import type { AccountSidebarUser } from "./components/AccountSidebar";

/** ตัวย่อสองตัวจากชื่อที่แสดง ใช้เป็นรูปแทนเมื่อผู้ใช้ยังไม่มี avatar */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0];
  return letters.toUpperCase();
}

/** ผู้ใช้ที่ login อยู่ → ข้อมูลที่ `AccountSidebar` ต้องใช้ */
export function toSidebarUser(user: AuthUser | null): AccountSidebarUser {
  if (!user) {
    return { initials: "?", name: "", email: "" };
  }
  return {
    initials: initialsOf(user.displayName),
    name: user.displayName,
    email: user.email,
  };
}
