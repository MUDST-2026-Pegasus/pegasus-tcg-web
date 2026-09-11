import { useState } from "react";

import { Ellipsis } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminUserRole,
  AdminUsersData,
  AdminUserStatus,
} from "@/features/admin/admin.types";
import { SellerAvatar } from "@/features/admin/components/SellerAvatar";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<AdminUserRole, string> = {
  buyer: "bg-[#eef1f2] text-muted-foreground",
  seller: "bg-[#e6f4f2] text-[#0d9488]",
};

const STATUS_BADGE: Record<AdminUserStatus, string> = {
  active: "bg-[#e3f4ec] text-[#12805c]",
  suspended: "bg-[#fbe9e8] text-[#d0342c]",
  kycPending: "bg-[#fdf0dd] text-[#b45309]",
};

const HEAD_CLASS = "h-auto py-2.5 text-[11px] font-medium text-muted-foreground";

const CELL_CLASS = "py-[11px] text-xs";

type UsersTableProps = {
  users: AdminUsersData["users"];
  table: AdminUsersData["table"];
  pagination: AdminUsersData["pagination"];
};

/**
 * ตารางผู้ใช้ทั้งหมด + แถบเลขหน้าด้านล่าง
 *
 * การติ๊กเลือกแถวเป็นสถานะของตารางล้วน ๆ ยังไม่มีส่วนอื่นของหน้าที่ต้องรู้
 * จึงเก็บ state ไว้ในนี้ ไม่ต้องยกขึ้นไปที่ AdminUsersContent
 *
 * หมายเหตุ: ในดีไซน์ตารางเป็น flex ที่กำหนดความกว้างคอลัมน์ตายตัว
 * ที่นี่ใช้ <table> จริงเพื่อให้ screen reader อ่านหัวคอลัมน์ได้
 * โดยคุมความกว้างผ่าน w-* บน <th> แทน — หน้าตายังเหมือนเดิม
 */
export function UsersTable({ users, table, pagination }: UsersTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = users.length > 0 && selectedIds.length === users.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? users.map((user) => user.id) : []);
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-y border-[#eef1f2] bg-[#fafbfb] hover:bg-[#fafbfb]">
            <TableHead className={cn(HEAD_CLASS, "w-[54px] pl-5")}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={toggleAll}
                aria-label={table.selectAllLabel}
                className="size-[15px] rounded-[4px]"
              />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[300px]")}>
              {table.columns.user}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[120px]")}>
              {table.columns.role}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[100px]")}>
              {table.columns.orders}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[130px]")}>
              {table.columns.spend}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[130px]")}>
              {table.columns.joinedAt}
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-[120px]")}>
              {table.columns.status}
            </TableHead>
            {/* คอลัมน์สุดท้ายไม่มีหัวตารางในดีไซน์ และกินพื้นที่ที่เหลือแทน spacer */}
            <TableHead className={cn(HEAD_CLASS, "pr-5")}>
              <span className="sr-only">{table.columns.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="[&_tr]:border-[#eef1f2]">
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="even:bg-[#fcfdfd] hover:bg-[#f6f8f9]"
            >
              <TableCell className={cn(CELL_CLASS, "pl-5")}>
                <Checkbox
                  checked={selectedIds.includes(user.id)}
                  onCheckedChange={(checked) => toggleRow(user.id, checked)}
                  aria-label={`${table.selectRowLabel}: ${user.handle}`}
                  className="size-[15px] rounded-[4px]"
                />
              </TableCell>

              <TableCell className={CELL_CLASS}>
                <div className="flex items-center gap-2.5">
                  <SellerAvatar
                    initials={user.initials}
                    accent={user.avatarAccent}
                    className="size-7"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {user.handle}
                    </span>
                    <span className="text-[10px] text-[#9aa5ad]">
                      {user.email}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className={CELL_CLASS}>
                <Badge
                  className={cn(
                    "rounded-[5px] px-2 text-[10px]",
                    ROLE_BADGE[user.role],
                  )}
                >
                  {user.roleLabel}
                </Badge>
              </TableCell>

              <TableCell className={cn(CELL_CLASS, "text-[#414755]")}>
                {user.orders}
              </TableCell>

              <TableCell
                className={cn(CELL_CLASS, "font-medium text-foreground")}
              >
                {user.spend}
              </TableCell>

              <TableCell className={cn(CELL_CLASS, "text-muted-foreground")}>
                {user.joinedAt}
              </TableCell>

              <TableCell className={CELL_CLASS}>
                <Badge
                  className={cn(
                    "rounded-full px-2 text-[11px]",
                    STATUS_BADGE[user.status],
                  )}
                >
                  {user.statusLabel}
                </Badge>
              </TableCell>

              <TableCell className={cn(CELL_CLASS, "pr-5 text-right")}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${table.columns.actions}: ${user.handle}`}
                  className="rounded-md text-[#9aa5ad]"
                >
                  <Ellipsis className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f2] px-5 py-3.5">
        <p className="text-xs text-muted-foreground">{pagination.summary}</p>

        <nav aria-label="เลขหน้า" className="flex items-center gap-1.5">
          <Button variant="outline" className="rounded-md px-2.5">
            {pagination.previousLabel}
          </Button>

          {pagination.pages.map((page) => {
            const isActive = page === pagination.activePage;

            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "size-[30px] rounded-[7px] p-0 text-xs font-medium",
                  !isActive && "text-[#414755]",
                )}
              >
                {page}
              </Button>
            );
          })}

          {pagination.hasMore ? (
            <span aria-hidden="true" className="text-xs text-[#9aa5ad]">
              …
            </span>
          ) : null}

          <Button variant="outline" className="rounded-md px-2.5">
            {pagination.nextLabel}
          </Button>
        </nav>
      </div>
    </>
  );
}
