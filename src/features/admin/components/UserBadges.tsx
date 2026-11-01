import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  ROLE_LABEL,
  USER_STATUS_LABEL,
  sortedRoles,
  userAccent,
  userInitials,
} from "../users.format";
import type { AdminUser, RoleCode, UserStatus } from "../users.types";
import { SellerAvatar } from "./SellerAvatar";

/** สีของ badge ตามบอร์ด "V2 · Admin / จัดการผู้ใช้" — ใช้ทั้งตาราง Sidebar และ dialog */
const ROLE_BADGE: Record<RoleCode, string> = {
  BUYER: "bg-[#eef1f2] text-muted-foreground",
  SELLER: "bg-[#e6f4f2] text-[#0d9488]",
  ADMIN: "bg-[#e8f1fc] text-[#0058bc]",
  SUPPORT: "bg-[#ecebff] text-[#4f46e5]",
};

const STATUS_BADGE: Record<UserStatus, string> = {
  ACTIVE: "bg-[#e3f4ec] text-[#12805c]",
  SUSPENDED: "bg-[#fbe9e8] text-[#d0342c]",
  DEACTIVATED: "bg-[#eef1f2] text-muted-foreground",
};

export function RoleBadge({ role }: { role: RoleCode }) {
  return (
    <Badge className={cn("rounded-[5px] px-2 text-[10px]", ROLE_BADGE[role])}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}

/** บทบาทเรียงจากอำนาจมากไปน้อย */
export function RoleBadges({ roles, className }: { roles: RoleCode[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {sortedRoles(roles).map((role) => (
        <RoleBadge key={role} role={role} />
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge className={cn("rounded-full px-2 text-[11px]", STATUS_BADGE[status])}>
      {USER_STATUS_LABEL[status]}
    </Badge>
  );
}

/**
 * กล่องเทา "กำลังทำกับบัญชีไหน" ใน dialog ยืนยันทุกอัน
 * avatar 32px · ชื่อ + @username · อีเมล · บทบาทชิดขวา
 */
export function UserSummary({ user }: { user: AdminUser }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] bg-[#f6f8f9] px-3 py-2.5">
      <SellerAvatar
        initials={userInitials(user)}
        accent={userAccent(user)}
        src={user.avatarUrl}
        className="size-8 [&_[data-slot=avatar-fallback]]:text-xs"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-xs">
          <span className="font-medium text-foreground">{user.displayName}</span>
          <span className="ml-1.5 text-muted-foreground">@{user.username}</span>
        </p>
        <p className="truncate text-[10px] text-[#9aa5ad]">{user.email}</p>
      </div>
      <RoleBadges roles={user.roles} className="shrink-0 flex-nowrap" />
    </div>
  );
}
