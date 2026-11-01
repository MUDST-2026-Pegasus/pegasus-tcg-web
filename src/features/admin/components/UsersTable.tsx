import { CircleX, Ellipsis, RotateCw, Shield, User, UserX } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  formatLastLogin,
  formatThaiDate,
  pageNumbers,
  pageSummary,
  userAccent,
  userInitials,
} from "../users.format";
import type { AdminUser } from "../users.types";
import { SellerAvatar } from "./SellerAvatar";
import { RoleBadges, StatusBadge } from "./UserBadges";

const HEAD_CLASS = "h-auto py-2.5 text-[11px] font-medium text-muted-foreground";
const CELL_CLASS = "py-[11px] text-xs";

const MENU_ITEM_CLASS = "gap-2 rounded-[7px] px-2.5 py-[7px] text-xs font-normal [&_svg]:size-3.5";

export type UserAction = "view" | "roles" | "suspend" | "restore" | "deactivate";

type UsersTableProps = {
  users: AdminUser[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  /** id ของแอดมินที่ login อยู่ — แถวตัวเองดูได้อย่างเดียว (backend ก็กันไว้) */
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
 * คลิกแถวเปิด Sidebar รายละเอียด (คีย์บอร์ดใช้ปุ่มชื่อผู้ใช้แทน)
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
            return (
              <TableRow
                key={user.id}
                onClick={() => onAction(user, "view")}
                className="cursor-pointer even:bg-[#fcfdfd] hover:bg-[#f6f8f9]"
              >
                <TableCell className={cn(CELL_CLASS, "pl-5")}>
                  <div className="flex items-center gap-2.5">
                    <SellerAvatar
                      initials={userInitials(user)}
                      accent={userAccent(user)}
                      src={user.avatarUrl}
                      className="size-7"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAction(user, "view");
                        }}
                        aria-label={`ดูรายละเอียด: ${user.username}`}
                        className="truncate rounded-sm text-left font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {user.displayName}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          @{user.username}
                        </span>
                        {isSelf ? (
                          <span className="ml-1.5 text-[10px] font-normal text-primary">
                            (คุณ)
                          </span>
                        ) : null}
                      </button>
                      <span className="truncate text-[10px] text-[#9aa5ad]">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  <RoleBadges roles={user.roles} />
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "text-muted-foreground")}>
                  {formatThaiDate(user.createdAt)}
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "text-muted-foreground")}>
                  {formatLastLogin(user.lastLoginAt)}
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  <StatusBadge status={user.status} />
                </TableCell>
                {/* เมนูอยู่ใน portal แต่ event ยังไหลตาม React tree — กันไม่ให้ไปเปิด Sidebar ซ้อน */}
                <TableCell
                  className={cn(CELL_CLASS, "pr-5 text-right")}
                  onClick={(event) => event.stopPropagation()}
                >
                  <UserRowMenu user={user} isSelf={isSelf} onAction={onAction} />
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

type UserRowMenuProps = {
  user: AdminUser;
  isSelf: boolean;
  onAction: (user: AdminUser, action: UserAction) => void;
};

/**
 * เมนู ⋯ ต่อแถว ตาม Figma — รายการเปลี่ยนตามสถานะ
 * แถวของตัวเองเปิดได้ แต่ใช้ได้แค่ "ดูรายละเอียด" พร้อมบอกเหตุผล
 */
function UserRowMenu({ user, isSelf, onAction }: UserRowMenuProps) {
  const locked = isSelf;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
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
      <DropdownMenuContent align="end" className="w-[232px] gap-0.5 rounded-xl p-1.5">
        <DropdownMenuItem className={MENU_ITEM_CLASS} onClick={() => onAction(user, "view")}>
          <User />
          ดูรายละเอียด
        </DropdownMenuItem>
        <DropdownMenuItem
          className={MENU_ITEM_CLASS}
          disabled={locked || user.status === "DEACTIVATED"}
          onClick={() => onAction(user, "roles")}
        >
          <Shield />
          จัดการบทบาท…
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-[#eef1f2]" />
        {user.status === "ACTIVE" ? (
          <DropdownMenuItem
            variant="destructive"
            className={MENU_ITEM_CLASS}
            disabled={locked}
            onClick={() => onAction(user, "suspend")}
          >
            <CircleX />
            ระงับบัญชี
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className={MENU_ITEM_CLASS}
            disabled={locked}
            onClick={() => onAction(user, "restore")}
          >
            <RotateCw />
            เปิดใช้งานอีกครั้ง
          </DropdownMenuItem>
        )}
        {user.status !== "DEACTIVATED" ? (
          <DropdownMenuItem
            variant="destructive"
            className={MENU_ITEM_CLASS}
            disabled={locked}
            onClick={() => onAction(user, "deactivate")}
          >
            <UserX />
            ปิดบัญชี
          </DropdownMenuItem>
        ) : null}
        {locked ? (
          <p className="px-2.5 py-1.5 text-[10px] leading-[14px] text-[#9aa5ad]">
            นี่คือบัญชีของคุณ — เปลี่ยนสถานะหรือถอนสิทธิ์ผู้ดูแลของตัวเองไม่ได้
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** skeleton โหลดครั้งแรก — รูปทรงเดียวกับแถวจริง */
export function UsersTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดรายชื่อผู้ใช้" className="border-t border-[#eef1f2]">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-6 border-b border-[#eef1f2] px-5 py-[13px] last:border-b-0"
        >
          <div className="flex w-[290px] items-center gap-2.5">
            <Skeleton className="size-7 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-2.5 w-32 rounded" />
              <Skeleton className="h-2 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-14 rounded-[5px]" />
          <Skeleton className="ml-auto hidden h-2.5 w-20 rounded sm:block" />
          <Skeleton className="hidden h-2.5 w-20 rounded sm:block" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
