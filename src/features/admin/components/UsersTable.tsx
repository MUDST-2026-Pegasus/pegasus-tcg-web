import { DataTable, type DataTableColumn } from "@/components/common";
import { CircleX, Ellipsis, RotateCw, Shield, User, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("admin");

  const columns: DataTableColumn<AdminUser>[] = [
    {
      id: "user",
      header: t("users.table.user", "ผู้ใช้"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[320px] pl-5"), cellClassName: cn(CELL_CLASS, "pl-5") },
      cell: ({ row: { original: user } }) => (
        <div className="flex items-center gap-2.5">
          <SellerAvatar initials={userInitials(user)} accent={userAccent(user)} src={user.avatarUrl} className="size-7" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAction(user, "view");
              }}
              aria-label={t("users.table.viewDetailAria", "ดูรายละเอียด: {username}", { username: user.username })}
              className="truncate rounded-sm text-left font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {user.displayName}
              <span className="ml-1.5 font-normal text-muted-foreground">@{user.username}</span>
              {user.id === currentUserId ? (
                <span className="ml-1.5 text-[10px] font-normal text-primary">
                  {t("users.table.you", "(คุณ)")}
                </span>
              ) : null}
            </button>
            <span className="truncate text-[10px] text-[#9aa5ad]">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: "roles",
      header: t("users.table.roles", "บทบาท"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[200px]"), cellClassName: CELL_CLASS },
      cell: ({ row }) => <RoleBadges roles={row.original.roles} />,
    },
    {
      id: "created",
      header: t("users.table.created", "สมัครเมื่อ"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[130px]"), cellClassName: cn(CELL_CLASS, "text-muted-foreground") },
      cell: ({ row }) => formatThaiDate(row.original.createdAt),
    },
    {
      id: "lastLogin",
      header: t("users.table.lastLogin", "เข้าใช้ล่าสุด"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[140px]"), cellClassName: cn(CELL_CLASS, "text-muted-foreground") },
      cell: ({ row }) => formatLastLogin(row.original.lastLoginAt),
    },
    {
      id: "status",
      header: t("users.table.status", "สถานะ"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[120px]"), cellClassName: CELL_CLASS },
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      // คอลัมน์สุดท้ายไม่มีหัวตารางในดีไซน์ และกินพื้นที่ที่เหลือแทน spacer
      id: "menu",
      header: () => <span className="sr-only">{t("users.table.moreOptions", "ตัวเลือกเพิ่มเติม")}</span>,
      meta: { headClassName: cn(HEAD_CLASS, "pr-5"), cellClassName: cn(CELL_CLASS, "pr-5 text-right") },
      cell: ({ row: { original: user } }) => (
        // เมนูอยู่ใน portal แต่ event ยังไหลตาม React tree — กันไม่ให้ไปเปิด Sidebar ซ้อน
        <span onClick={(event) => event.stopPropagation()}>
          <UserRowMenu user={user} isSelf={user.id === currentUserId} onAction={onAction} />
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        getRowId={(user) => String(user.id)}
        tableClassName={cn(disabled && "opacity-60")}
        headerRowClassName="border-y border-muted bg-[#fafbfb] hover:bg-[#fafbfb]"
        bodyClassName="[&_tr]:border-muted"
        rowClassName={() => "even:bg-[#fcfdfd] hover:bg-[#f6f8f9]"}
        onRowClick={(user) => onAction(user, "view")}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-muted px-5 py-3.5">
        <p className="text-xs text-muted-foreground">
          {pageSummary(page, size, totalItems)}
        </p>
        <nav aria-label={t("users.table.paginationAria", "เลขหน้า")} className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="rounded-md px-2.5"
            disabled={disabled || page <= 0}
            onClick={() => onPageChange(page - 1)}
          >
            {t("actions.previous", "ก่อนหน้า", { ns: "common" })}
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
            {t("actions.next", "ถัดไป", { ns: "common" })}
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
  const { t } = useTranslate("admin");
  const locked = isSelf;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("users.table.moreOptionsAria", "ตัวเลือกเพิ่มเติม: {username}", { username: user.username })}
            className="rounded-md text-[#9aa5ad]"
          />
        }
      >
        <Ellipsis className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[232px] gap-0.5 rounded-xl p-1.5">
        <DropdownMenuItem className={MENU_ITEM_CLASS} onClick={() => onAction(user, "view")}>
          <User />
          {t("users.menu.viewDetail", "ดูรายละเอียด")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={MENU_ITEM_CLASS}
          disabled={locked || user.status === "DEACTIVATED"}
          onClick={() => onAction(user, "roles")}
        >
          <Shield />
          {t("users.menu.manageRoles", "จัดการบทบาท…")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-muted" />
        {user.status === "ACTIVE" ? (
          <DropdownMenuItem
            variant="destructive"
            className={MENU_ITEM_CLASS}
            disabled={locked}
            onClick={() => onAction(user, "suspend")}
          >
            <CircleX />
            {t("users.menu.suspend", "ระงับบัญชี")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className={MENU_ITEM_CLASS}
            disabled={locked}
            onClick={() => onAction(user, "restore")}
          >
            <RotateCw />
            {t("users.menu.restore", "เปิดใช้งานอีกครั้ง")}
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
            {t("users.menu.deactivate", "ปิดบัญชี")}
          </DropdownMenuItem>
        ) : null}
        {locked ? (
          <p className="px-2.5 py-1.5 text-[10px] leading-[14px] text-[#9aa5ad]">
            {t(
              "users.menu.selfAccountHint",
              "นี่คือบัญชีของคุณ — เปลี่ยนสถานะหรือถอนสิทธิ์ผู้ดูแลของตัวเองไม่ได้",
            )}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** skeleton โหลดครั้งแรก — รูปทรงเดียวกับแถวจริง */
export function UsersTableSkeleton() {
  const { t } = useTranslate("admin");
  return (
    <div
      aria-busy="true"
      aria-label={t("users.table.skeletonAria", "กำลังโหลดรายชื่อผู้ใช้")}
      className="border-t border-muted"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-6 border-b border-muted px-5 py-[13px] last:border-b-0"
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
