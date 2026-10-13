import { Ellipsis } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  ROLE_LABEL,
  USER_STATUS_LABEL,
  formatLastLogin,
  formatThaiDate,
  pageNumbers,
  pageSummary,
  sortedRoles,
  userAccent,
  userInitials,
} from "../users.format";
import type { AdminUser, RoleCode, UserStatus } from "../users.types";
import { SellerAvatar } from "./SellerAvatar";

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

const HEAD_CLASS = "h-auto py-2.5 text-[11px] font-medium text-muted-foreground";
const CELL_CLASS = "py-[11px] text-xs";

export type UserAction =
  | "suspend"
  | "restore"
  | "deactivate"
  | "grant-admin"
  | "revoke-admin";

type UsersTableProps = {
  users: AdminUser[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  /** id ของแอดมินที่ login อยู่ — แถวตัวเองจัดการไม่ได้ (backend ก็กันไว้) */
  currentUserId: number | null;
  disabled: boolean;
  onPageChange: (page: number) => void;
  onAction: (user: AdminUser, action: UserAction) => void;
};

/**
 * ตารางผู้ใช้ + แถบเลขหน้าด้านล่าง
 *
 * ดีไซน์เดิมมีคอลัมน์จำนวนคำสั่งซื้อและยอดใช้จ่าย แต่ `/admin/users` ไม่ได้ส่งมา
 * จึงใช้วันสมัครและวันที่เข้าใช้ล่าสุดแทน ช่องติ๊กเลือกหลายแถวก็เอาออก
 * เพราะ backend ยังไม่มีคำสั่งแบบกลุ่ม
 *
 * ใช้ <table> จริงเพื่อให้ screen reader อ่านหัวคอลัมน์ได้
 */
export function UsersTable({
  users,
  page,
  size,
  totalItems,
  totalPages,
  currentUserId,
  disabled,
  onPageChange,
  onAction,
}: UsersTableProps) {
  return (
    <>
      <Table className={cn(disabled && "opacity-60")}>
        <TableHeader>
          <TableRow className="border-y border-[#eef1f2] bg-[#fafbfb] hover:bg-[#fafbfb]">
            <TableHead className={cn(HEAD_CLASS, "w-[320px] pl-5")}>ผู้ใช้</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[200px]")}>บทบาท</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[130px]")}>สมัครเมื่อ</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[140px]")}>เข้าใช้ล่าสุด</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[120px]")}>สถานะ</TableHead>
            {/* คอลัมน์สุดท้ายไม่มีหัวตารางในดีไซน์ และกินพื้นที่ที่เหลือแทน spacer */}
            <TableHead className={cn(HEAD_CLASS, "pr-5")}>
              <span className="sr-only">ตัวเลือกเพิ่มเติม</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:border-[#eef1f2]">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isAdmin = user.roles.includes("ADMIN");
            return (
              <TableRow key={user.id} className="even:bg-[#fcfdfd] hover:bg-[#f6f8f9]">
                <TableCell className={cn(CELL_CLASS, "pl-5")}>
                  <div className="flex items-center gap-2.5">
                    <SellerAvatar
                      initials={userInitials(user)}
                      accent={userAccent(user)}
                      className="size-7"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium text-foreground">
                        {user.displayName}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          @{user.username}
                        </span>
                        {isSelf ? (
                          <span className="ml-1.5 text-[10px] font-normal text-primary">
                            (คุณ)
                          </span>
                        ) : null}
                      </span>
                      <span className="truncate text-[10px] text-[#9aa5ad]">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  <div className="flex flex-wrap gap-1">
                    {sortedRoles(user.roles).map((role) => (
                      <Badge
                        key={role}
                        className={cn("rounded-[5px] px-2 text-[10px]", ROLE_BADGE[role])}
                      >
                        {ROLE_LABEL[role]}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "text-muted-foreground")}>
                  {formatThaiDate(user.createdAt)}
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "text-muted-foreground")}>
                  {formatLastLogin(user.lastLoginAt)}
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  <Badge
                    className={cn("rounded-full px-2 text-[11px]", STATUS_BADGE[user.status])}
                  >
                    {USER_STATUS_LABEL[user.status]}
                  </Badge>
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "pr-5 text-right")}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={isSelf}
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`ตัวเลือกเพิ่มเติม: ${user.username}`}
                          className="rounded-md text-[#9aa5ad]"
                        />
                      }
                    >
                      <Ellipsis className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-auto rounded-xl">
                      {isAdmin ? (
                        <DropdownMenuItem onClick={() => onAction(user, "revoke-admin")}>
                          ถอนสิทธิ์ผู้ดูแล
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onAction(user, "grant-admin")}>
                          ตั้งเป็นผู้ดูแล
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {user.status === "ACTIVE" ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onAction(user, "suspend")}
                        >
                          ระงับบัญชี
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onAction(user, "restore")}>
                          เปิดใช้งานอีกครั้ง
                        </DropdownMenuItem>
                      )}
                      {user.status !== "DEACTIVATED" ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onAction(user, "deactivate")}
                        >
                          ปิดบัญชี
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f2] px-5 py-3.5">
        <p className="text-xs text-muted-foreground">
          {pageSummary(page, size, totalItems)}
        </p>
        <nav aria-label="เลขหน้า" className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="rounded-md px-2.5"
            disabled={disabled || page <= 0}
            onClick={() => onPageChange(page - 1)}
          >
            ก่อนหน้า
          </Button>
          {pageNumbers(page, totalPages).map((value, index) =>
            value === null ? (
              <span key={`gap-${index}`} aria-hidden="true" className="text-xs text-[#9aa5ad]">
                …
              </span>
            ) : (
              <Button
                key={value}
                variant={value === page ? "default" : "outline"}
                aria-current={value === page ? "page" : undefined}
                disabled={disabled}
                onClick={() => onPageChange(value)}
                className={cn(
                  "size-[30px] rounded-[7px] p-0 text-xs font-medium",
                  value !== page && "text-[#414755]",
                )}
              >
                {value + 1}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            className="rounded-md px-2.5"
            disabled={disabled || page + 1 >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ถัดไป
          </Button>
        </nav>
      </div>
    </>
  );
}
