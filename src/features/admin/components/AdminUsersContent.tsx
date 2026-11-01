import { useState } from "react";

import { Plus, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/auth.queries";

import { formatCount } from "../catalog.format";
import { useAdminUsers, useUserCounts } from "../users.queries";
import type { AdminUser, RoleCode, UserStatus } from "../users.types";
import { AddAdminDialog } from "./AddAdminDialog";
import { UserDetailSheet } from "./UserDetailSheet";
import { UserRolesDialog } from "./UserRolesDialog";
import { type UserStatusAction, UserStatusDialog } from "./UserStatusDialog";
import { UsersTable, UsersTableSkeleton } from "./UsersTable";
import { type UserFilters, UsersToolbar } from "./UsersToolbar";

const PAGE_SIZE = 20;

const ROLES: RoleCode[] = ["BUYER", "SELLER", "ADMIN", "SUPPORT"];
const STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

/** ค่าที่ไม่รู้จักใน URL (พิมพ์มาเอง/ลิงก์เก่า) ถือว่าไม่ได้กรอง */
function readFilters(params: URLSearchParams): UserFilters & { page: number } {
  const role = params.get("role") as RoleCode | null;
  const status = params.get("status") as UserStatus | null;
  const page = Number(params.get("page") ?? "1");
  return {
    q: params.get("q") ?? "",
    role: role && ROLES.includes(role) ? role : null,
    status: status && STATUSES.includes(status) ? status : null,
    page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
  };
}

/** `?user={id}` — มีแค่ id ใน URL ไม่มี PII */
function readUserId(params: URLSearchParams): number | null {
  const id = Number(params.get("user"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

type OpenDialog =
  | { kind: "status"; user: AdminUser; action: UserStatusAction }
  | { kind: "roles"; user: AdminUser }
  | { kind: "add-admin" };

/**
 * จัดการผู้ใช้ — ค้นหา กรอง ดูรายละเอียด เปลี่ยนสถานะ และจัดการบทบาท
 * ผ่าน `/admin/users` + `/users/{id}/roles`
 */
export function AdminUsersContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, ...filters } = readFilters(searchParams);
  const detailUserId = readUserId(searchParams);
  const { user: me } = useAuth();
  const currentUserId = me?.id ?? null;

  const users = useAdminUsers({
    q: filters.q,
    role: filters.role ?? undefined,
    status: filters.status ?? undefined,
    page,
    size: PAGE_SIZE,
  });
  const counts = useUserCounts();
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  // แถวที่คลิก — Sidebar ใช้แสดงไปก่อนระหว่างรอ GET /admin/users/{id}
  const [preview, setPreview] = useState<AdminUser | undefined>(undefined);

  function writeParams(changes: Partial<UserFilters> & { page?: number }) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        const set = (key: string, value: string | null | undefined) =>
          value ? next.set(key, value) : next.delete(key);
        if ("q" in changes) set("q", changes.q);
        if ("role" in changes) set("role", changes.role);
        if ("status" in changes) set("status", changes.status);
        // เปลี่ยนตัวกรองแล้วกลับไปหน้าแรก
        set("page", changes.page ? String(changes.page + 1) : null);
        return next;
      },
      { replace: true },
    );
  }

  function openDetail(user: AdminUser | null) {
    setPreview(user ?? undefined);
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (user) {
          next.set("user", String(user.id));
        } else {
          next.delete("user");
        }
        return next;
      },
      { replace: true },
    );
  }

  const clearFilters = () => writeParams({ q: "", role: null, status: null });
  const filtered = Boolean(filters.q || filters.role || filters.status);

  return (
    <div className="flex flex-col gap-6">
      {/* หัวหน้า: ชื่อหน้า + ปุ่มการทำงาน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            จัดการผู้ใช้
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {counts.isPending
              ? "กำลังนับจำนวนบัญชี…"
              : `ผู้ใช้ทั้งหมด ${formatCount(counts.total)} บัญชี · ผู้ขาย ${formatCount(counts.sellers)} · ระงับ ${formatCount(counts.suspended)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* backend ยังไม่มี endpoint ส่งออก ปิดไว้พร้อมบอกเหตุผล */}
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button variant="outline" className="rounded-md px-2.5" disabled>
                ส่งออก CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>ยังส่งออกเป็นไฟล์ไม่ได้ในตอนนี้</TooltipContent>
          </Tooltip>
          <Button className="rounded-md px-2.5" onClick={() => setDialog({ kind: "add-admin" })}>
            <Plus data-icon="inline-start" />
            เพิ่มผู้ดูแล
          </Button>
        </div>
      </div>

      {/* การ์ดเดียวครอบทั้งแถบเครื่องมือ ตาราง และเลขหน้า ตามดีไซน์ */}
      <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0">
        <UsersToolbar filters={filters} onChange={writeParams} onClear={clearFilters} />
        <QueryBoundary
          query={users}
          loading={<UsersTableSkeleton />}
          errorTitle="โหลดรายชื่อผู้ใช้ไม่สำเร็จ"
          errorMessage="เครือข่ายขัดข้องหรือเซสชันหมดอายุ — ข้อมูลที่ค้นไว้ยังอยู่ใน URL"
          isEmpty={(result) => result.items.length === 0}
          empty={<UsersEmpty filtered={filtered} onClear={clearFilters} />}
        >
          {(result) => (
            <UsersTable
              users={result.items}
              page={result.page}
              size={result.size}
              totalItems={result.totalItems}
              totalPages={result.totalPages}
              currentUserId={currentUserId}
              disabled={users.isPlaceholderData}
              onPageChange={(next) => writeParams({ page: next })}
              onAction={(user, action) => {
                if (action === "view") openDetail(user);
                else if (action === "roles") setDialog({ kind: "roles", user });
                else setDialog({ kind: "status", user, action });
              }}
            />
          )}
        </QueryBoundary>
      </Card>

      <UserDetailSheet
        userId={detailUserId}
        preview={preview}
        currentUserId={currentUserId}
        onClose={() => openDetail(null)}
        onStatusAction={(user, action) => setDialog({ kind: "status", user, action })}
        onManageRoles={(user) => setDialog({ kind: "roles", user })}
      />

      {dialog?.kind === "status" ? (
        <UserStatusDialog
          key={`${dialog.action}-${dialog.user.id}`}
          user={dialog.user}
          action={dialog.action}
          onClose={() => setDialog(null)}
        />
      ) : dialog?.kind === "roles" ? (
        <UserRolesDialog
          key={dialog.user.id}
          user={dialog.user}
          currentUserId={currentUserId}
          onClose={() => setDialog(null)}
        />
      ) : dialog?.kind === "add-admin" ? (
        <AddAdminDialog onClose={() => setDialog(null)} />
      ) : null}
    </div>
  );
}

/** กรองแล้วไม่พบ → มีปุ่มล้าง · ยังไม่มีผู้ใช้เลย → ไม่มีปุ่ม */
function UsersEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 border-t border-[#eef1f2] px-5 py-11 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-[#eef1f2]">
        <Users aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      <p className="text-[13px] font-semibold text-foreground">
        {filtered ? "ไม่พบผู้ใช้ที่ตรงกับตัวกรอง" : "ยังไม่มีผู้ใช้"}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {filtered
          ? "ลองลดตัวกรอง หรือค้นด้วยอีเมล / username แทน"
          : "บัญชีจะขึ้นที่นี่เมื่อมีคนสมัครสมาชิก"}
      </p>
      {filtered ? (
        <Button variant="outline" size="sm" className="rounded-md" onClick={onClear}>
          ล้างตัวกรองทั้งหมด
        </Button>
      ) : null}
    </div>
  );
}
