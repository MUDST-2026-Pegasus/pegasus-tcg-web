import { useState } from "react";

import { Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary } from "@/components/common";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/auth.queries";

import { formatCount } from "../catalog.format";
import { ROLE_LABEL, USER_STATUS_LABEL, userErrorMessage } from "../users.format";
import {
  useAdminUsers,
  useChangeRole,
  useUpdateUserStatus,
  useUserCounts,
} from "../users.queries";
import type { AdminUser, RoleCode, UserStatus } from "../users.types";
import { type UserAction, UsersTable } from "./UsersTable";
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

type ActionCopy = {
  title: string;
  description: string;
  confirm: string;
  destructive: boolean;
};

function actionCopy(user: AdminUser, action: UserAction): ActionCopy {
  const name = `@${user.username}`;
  switch (action) {
    case "suspend":
      return {
        title: `ระงับบัญชี ${name}?`,
        description:
          "ผู้ใช้จะถูกออกจากระบบทุกอุปกรณ์ภายในไม่กี่นาที และเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง",
        confirm: "ระงับบัญชี",
        destructive: true,
      };
    case "deactivate":
      return {
        title: `ปิดบัญชี ${name}?`,
        description:
          "ผู้ใช้จะถูกออกจากระบบและเข้าใช้ไม่ได้อีก ใช้กับบัญชีที่ขอปิดหรือไม่ใช้งานแล้ว เปิดกลับได้ภายหลัง",
        confirm: "ปิดบัญชี",
        destructive: true,
      };
    case "restore":
      return {
        title: `เปิดใช้งาน ${name} อีกครั้ง?`,
        description: "ผู้ใช้จะเข้าสู่ระบบและใช้งานได้ตามปกติ",
        confirm: "เปิดใช้งาน",
        destructive: false,
      };
    case "grant-admin":
      return {
        title: `ตั้ง ${name} เป็นผู้ดูแล?`,
        description:
          "จะเข้าหลังบ้านได้ทุกหน้า รวมถึงอนุมัติผู้ขาย แก้ค่าคอม และระงับบัญชีผู้อื่น มีผลเมื่อผู้ใช้ต่ออายุการเข้าสู่ระบบครั้งถัดไป",
        confirm: "ตั้งเป็นผู้ดูแล",
        destructive: false,
      };
    case "revoke-admin":
      return {
        title: `ถอนสิทธิ์ผู้ดูแลของ ${name}?`,
        description: "จะเข้าหลังบ้านไม่ได้อีก มีผลเมื่อผู้ใช้ต่ออายุการเข้าสู่ระบบครั้งถัดไป",
        confirm: "ถอนสิทธิ์",
        destructive: true,
      };
  }
}

const NEXT_STATUS: Partial<Record<UserAction, UserStatus>> = {
  suspend: "SUSPENDED",
  deactivate: "DEACTIVATED",
  restore: "ACTIVE",
};

/** จัดการผู้ใช้ — ค้นหา กรอง ระงับ และให้/ถอนสิทธิ์ผู้ดูแล ผ่าน `/admin/users` */
export function AdminUsersContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, ...filters } = readFilters(searchParams);
  const { user: me } = useAuth();

  const users = useAdminUsers({
    q: filters.q,
    role: filters.role ?? undefined,
    status: filters.status ?? undefined,
    page,
    size: PAGE_SIZE,
  });
  const counts = useUserCounts();
  const updateStatus = useUpdateUserStatus();
  const changeRole = useChangeRole();
  const [pending, setPending] = useState<{ user: AdminUser; action: UserAction } | null>(
    null,
  );
  const isSaving = updateStatus.isPending || changeRole.isPending;

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

  function confirm() {
    if (!pending) return;
    const { user, action } = pending;
    const done = {
      onSuccess: () => {
        setPending(null);
        toast.add({ type: "success", title: successTitle(user, action) });
      },
      onError: (error: unknown) =>
        toast.add({
          type: "error",
          title: "ทำรายการไม่สำเร็จ",
          description: userErrorMessage(error, "ลองใหม่อีกครั้ง"),
        }),
    };
    const status = NEXT_STATUS[action];
    if (status) {
      updateStatus.mutate({ userId: user.id, status }, done);
    } else {
      changeRole.mutate(
        { userId: user.id, role: "ADMIN", grant: action === "grant-admin" },
        done,
      );
    }
  }

  const copy = pending ? actionCopy(pending.user, pending.action) : null;
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

        {/* backend ยังไม่มี endpoint ส่งออก ปิดไว้พร้อมบอกเหตุผล
            ส่วนการเพิ่มผู้ดูแลย้ายไปอยู่ที่เมนู ⋯ ของแต่ละแถว */}
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Button variant="outline" className="rounded-md px-2.5" disabled>
              ส่งออก CSV
            </Button>
          </TooltipTrigger>
          <TooltipContent>ยังส่งออกเป็นไฟล์ไม่ได้ในตอนนี้</TooltipContent>
        </Tooltip>
      </div>

      {/* การ์ดเดียวครอบทั้งแถบเครื่องมือ ตาราง และเลขหน้า ตามดีไซน์ */}
      <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0">
        <UsersToolbar
          filters={filters}
          onChange={writeParams}
          onClear={() => writeParams({ q: "", role: null, status: null })}
        />
        <QueryBoundary
          query={users}
          loading={<UsersTableSkeleton />}
          errorTitle="โหลดรายชื่อผู้ใช้ไม่สำเร็จ"
          isEmpty={(result) => result.items.length === 0}
          empty={
            <div className="border-t border-muted py-6">
              <EmptyState
                icon={Users}
                title={filtered ? "ไม่พบผู้ใช้ที่ตรงกับตัวกรอง" : "ยังไม่มีผู้ใช้"}
              />
            </div>
          }
        >
          {(result) => (
            <UsersTable
              users={result.items}
              page={result.page}
              size={result.size}
              totalItems={result.totalItems}
              totalPages={result.totalPages}
              currentUserId={me?.id ?? null}
              disabled={users.isPlaceholderData}
              onPageChange={(next) => writeParams({ page: next })}
              onAction={(user, action) => setPending({ user, action })}
            />
          )}
        </QueryBoundary>
      </Card>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setPending(null);
        }}
      >
        <AlertDialogContent>
          {copy ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.title}</AlertDialogTitle>
                <AlertDialogDescription>{copy.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>ยกเลิก</AlertDialogCancel>
                <Button
                  variant={copy.destructive ? "destructive" : "default"}
                  onClick={confirm}
                  disabled={isSaving}
                >
                  {isSaving && <Spinner data-icon="inline-start" />}
                  {copy.confirm}
                </Button>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function successTitle(user: AdminUser, action: UserAction): string {
  const status = NEXT_STATUS[action];
  if (status) {
    return `@${user.username} ${USER_STATUS_LABEL[status]}แล้ว`;
  }
  return action === "grant-admin"
    ? `ตั้ง @${user.username} เป็น${ROLE_LABEL.ADMIN}แล้ว`
    : `ถอนสิทธิ์${ROLE_LABEL.ADMIN}ของ @${user.username} แล้ว`;
}

function UsersTableSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2 border-t border-muted px-5 py-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-10 rounded-md" />
      ))}
    </div>
  );
}
