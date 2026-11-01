import type { ReactNode } from "react";

import {
  CircleX,
  Copy,
  ExternalLink,
  Info,
  Store,
  UserRoundX,
  UserX,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  USER_STATUS_LABEL,
  formatLastLogin,
  formatPhone,
  formatThaiDate,
  isUserNotFound,
  userAccent,
  userInitials,
} from "../users.format";
import { useAdminUser } from "../users.queries";
import type { AdminUser } from "../users.types";
import { SellerAvatar } from "./SellerAvatar";
import { RoleBadges, StatusBadge } from "./UserBadges";
import { USER_DANGER_BUTTON } from "./UserDialog";
import type { UserStatusAction } from "./UserStatusDialog";

type UserDetailSheetProps = {
  /** `null` = ปิด — มาจาก `?user={id}` ใน URL */
  userId: number | null;
  /** แถวที่คลิกจากตาราง แสดงไปก่อนระหว่างโหลด (เปิดจากลิงก์จะไม่มี → skeleton) */
  preview?: AdminUser;
  currentUserId: number | null;
  onClose: () => void;
  onStatusAction: (user: AdminUser, action: UserStatusAction) => void;
  onManageRoles: (user: AdminUser) => void;
};

/**
 * Sidebar รายละเอียดผู้ใช้ (Sheet ขวา 440px) — `GET /admin/users/{id}`
 * มี PII (อีเมล เบอร์โทร) ห้าม log · ใน URL มีแค่ id
 */
export function UserDetailSheet({
  userId,
  preview,
  currentUserId,
  onClose,
  onStatusAction,
  onManageRoles,
}: UserDetailSheetProps) {
  const detail = useAdminUser(userId, preview);

  return (
    <Sheet
      open={userId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[440px] **:data-[slot=button]:rounded-md"
      >
        <header className="flex items-center border-b border-[#eef1f2] py-[18px] pr-4 pl-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <SheetTitle className="text-[15px] font-bold text-foreground">รายละเอียดผู้ใช้</SheetTitle>
            <SheetDescription className={cn("text-[11px] text-[#9aa5ad]", !detail.data && "sr-only")}>
              {detail.data ? `รหัสผู้ใช้ #${detail.data.id}` : "ข้อมูลบัญชีผู้ใช้"}
            </SheetDescription>
          </div>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="ปิด"
                className="size-7 rounded-[7px] text-muted-foreground"
              />
            }
          >
            <X />
          </SheetClose>
        </header>

        {/* 404 มาก่อนข้อมูลเก่าใน cache — บัญชีอาจถูกลบไประหว่างที่เปิดค้างไว้ */}
        {userId === null ? null : isUserNotFound(detail.error) ? (
          <UserNotFound onClose={onClose} />
        ) : detail.data ? (
          <UserDetailBody
            user={detail.data}
            isSelf={detail.data.id === currentUserId}
            onStatusAction={onStatusAction}
            onManageRoles={onManageRoles}
          />
        ) : detail.isPending ? (
          <UserDetailSkeleton />
        ) : (
          <div className="flex flex-1 items-center p-6">
            <ErrorState
              error={detail.error}
              title="โหลดข้อมูลผู้ใช้ไม่สำเร็จ"
              onRetry={() => void detail.refetch()}
              className="min-h-0 border-0"
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type UserDetailBodyProps = {
  user: AdminUser;
  isSelf: boolean;
  onStatusAction: (user: AdminUser, action: UserStatusAction) => void;
  onManageRoles: (user: AdminUser) => void;
};

function UserDetailBody({ user, isSelf, onStatusAction, onManageRoles }: UserDetailBodyProps) {
  const isSeller = user.roles.includes("SELLER");

  function copyEmail() {
    navigator.clipboard
      .writeText(user.email)
      .then(() => toast.add({ type: "success", title: "คัดลอกอีเมลแล้ว" }))
      .catch(() => toast.add({ type: "error", title: "คัดลอกไม่สำเร็จ" }));
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pt-5 pb-6">
        {/* โปรไฟล์ */}
        <div className="flex items-center gap-3.5">
          <SellerAvatar
            initials={userInitials(user)}
            accent={user.status === "ACTIVE" ? userAccent(user) : "slate"}
            src={user.avatarUrl}
            className="size-14 [&_[data-slot=avatar-fallback]]:text-xl"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="flex items-center gap-1.5">
              <span className="truncate text-[17px] font-bold text-foreground">{user.displayName}</span>
              {isSelf ? <span className="text-[11px] font-medium text-[#0058bc]">(คุณ)</span> : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            <div className="flex flex-wrap items-center gap-1">
              <StatusBadge status={user.status} />
              <RoleBadges roles={user.roles} />
            </div>
          </div>
        </div>

        {isSelf ? (
          <Banner
            tone="info"
            icon={<Info />}
            title="นี่คือบัญชีของคุณ"
            description="เปลี่ยนสถานะหรือถอนสิทธิ์ผู้ดูแลของตัวเองไม่ได้ — แก้ข้อมูลส่วนตัวที่หน้าโปรไฟล์"
          />
        ) : user.status === "SUSPENDED" ? (
          <Banner
            tone="danger"
            icon={<CircleX />}
            title="บัญชีนี้ถูกระงับ"
            description="ผู้ใช้ถูกออกจากระบบแล้วและเข้าสู่ระบบไม่ได้ จนกว่าจะเปิดใช้งานอีกครั้ง"
          />
        ) : user.status === "DEACTIVATED" ? (
          <Banner
            tone="muted"
            icon={<UserX />}
            title="บัญชีนี้ถูกปิดแล้ว"
            description="ผู้ใช้เข้าใช้ไม่ได้ จนกว่าจะเปิดใช้งานอีกครั้ง"
          />
        ) : null}

        <Section
          title="ข้อมูลติดต่อ"
          aside={
            <span className="rounded-full bg-[#fdf1e3] px-2 py-[3px] text-[10px] font-medium text-[#c2620a]">
              ข้อมูลส่วนบุคคล
            </span>
          }
        >
          <Row label="อีเมล">
            <span className="truncate">{user.email}</span>
            <button
              type="button"
              aria-label="คัดลอกอีเมล"
              onClick={copyEmail}
              className="shrink-0 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Copy aria-hidden="true" className="size-[13px]" />
            </button>
          </Row>
          <Row label="เบอร์โทร">
            <span>{formatPhone(user.phone)}</span>
            {user.phone ? (
              <span className="shrink-0 rounded-full bg-[#f1f3f4] px-2 py-[3px] text-[10px] font-medium text-muted-foreground">
                {user.phonePublic ? "แสดงบนหน้าร้าน" : "ไม่แสดงต่อสาธารณะ"}
              </span>
            ) : null}
          </Row>
        </Section>

        <Divider />

        <Section title="บัญชี">
          <Row label="สมัครเมื่อ">{formatThaiDate(user.createdAt)}</Row>
          <Row label="เข้าใช้ล่าสุด">{formatLastLogin(user.lastLoginAt)}</Row>
          {user.status === "ACTIVE" && !isSelf ? (
            <Row label="สถานะ">{USER_STATUS_LABEL[user.status]}</Row>
          ) : null}
        </Section>

        <Divider />

        <Section title="แนะนำตัว">
          {user.bio ? (
            <p className="text-xs leading-[18px] whitespace-pre-line text-[#414755]">{user.bio}</p>
          ) : (
            <p className="text-xs leading-[18px] text-[#9aa5ad]">ยังไม่ได้เขียนแนะนำตัว</p>
          )}
        </Section>

        <Divider />

        <Section
          title="บทบาท"
          aside={
            isSelf ? (
              <span className="text-[11px] font-medium text-[#9aa5ad]">ถอน ADMIN ตัวเองไม่ได้</span>
            ) : user.status === "DEACTIVATED" ? (
              <span className="text-[11px] font-medium text-[#9aa5ad]">เปิดใช้งานก่อนจึงจัดการบทบาทได้</span>
            ) : (
              <button
                type="button"
                onClick={() => onManageRoles(user)}
                className="rounded-sm text-[11px] font-medium text-[#0058bc] hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                จัดการบทบาท…
              </button>
            )
          }
        >
          <RoleBadges roles={user.roles} className="gap-1.5" />
        </Section>

        {isSeller ? (
          <Link
            to={`/u/${user.username}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-[10px] border border-[#e3e7e8] px-3 py-2.5 transition-colors hover:bg-[#f6f8f9] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Store aria-hidden="true" className="size-4 text-[#0d9488]" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">ดูหน้าร้านสาธารณะ</span>
              <span className="truncate text-[10px] text-[#9aa5ad]">/u/{user.username}</span>
            </span>
            <ExternalLink aria-hidden="true" className="size-3.5 text-muted-foreground" />
          </Link>
        ) : null}
      </div>

      <footer className="flex items-center gap-2.5 border-t border-[#eef1f2] bg-[#fafbfb] px-6 py-3.5">
        {isSelf ? (
          <>
            <p className="text-[11px] text-[#9aa5ad]">ปุ่มจัดการถูกปิดสำหรับบัญชีตัวเอง</p>
            <Button size="sm" className={cn("ml-auto", USER_DANGER_BUTTON)} disabled>
              ระงับบัญชี
            </Button>
          </>
        ) : (
          <>
            {user.status !== "DEACTIVATED" ? (
              <Button variant="ghost" size="sm" onClick={() => onStatusAction(user, "deactivate")}>
                ปิดบัญชี
              </Button>
            ) : null}
            {user.status === "ACTIVE" ? (
              <Button
                size="sm"
                className={cn("ml-auto", USER_DANGER_BUTTON)}
                onClick={() => onStatusAction(user, "suspend")}
              >
                ระงับบัญชี
              </Button>
            ) : (
              <Button size="sm" className="ml-auto" onClick={() => onStatusAction(user, "restore")}>
                เปิดใช้งานอีกครั้ง
              </Button>
            )}
          </>
        )}
      </footer>
    </>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex min-h-[18px] items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold text-muted-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-2 font-medium text-foreground">
        {children}
      </span>
    </div>
  );
}

function Divider() {
  return <div aria-hidden="true" className="h-px shrink-0 bg-[#eef1f2]" />;
}

const BANNER_TONE = {
  danger: "bg-[#fbe9e8] text-[#b42318]",
  info: "bg-[#eef5fd] text-[#0b4a99]",
  muted: "bg-[#f1f3f4] text-[#414755]",
} as const;

function Banner({
  tone,
  icon,
  title,
  description,
}: {
  tone: keyof typeof BANNER_TONE;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] px-3.5 py-3 [&_svg]:size-4 [&_svg]:shrink-0",
        BANNER_TONE[tone],
      )}
    >
      {icon}
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[11px] leading-[15px]">{description}</p>
      </div>
    </div>
  );
}

function UserNotFound({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 pt-5 pb-6 text-center">
        <div className="grid size-11 place-items-center rounded-full bg-[#eef1f2]">
          <UserRoundX aria-hidden="true" className="size-5 text-muted-foreground" />
        </div>
        <p className="text-[13px] font-semibold text-foreground">ไม่พบบัญชีนี้แล้ว</p>
        <p className="text-[11px] text-muted-foreground">ลิงก์อาจเก่า หรือรหัสผู้ใช้ไม่ถูกต้อง</p>
        <Button variant="outline" size="sm" onClick={onClose}>
          กลับไปที่รายการ
        </Button>
      </div>
      <footer className="flex justify-end border-t border-[#eef1f2] bg-[#fafbfb] px-6 py-3.5">
        <Button variant="outline" size="sm" onClick={onClose}>
          ปิด
        </Button>
      </footer>
    </>
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-2.5 w-20 rounded" />
      <div className="flex justify-between">
        <Skeleton className="h-2.5 w-[70px] rounded" />
        <Skeleton className="h-2.5 w-[130px] rounded" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-2.5 w-[70px] rounded" />
        <Skeleton className="h-2.5 w-[100px] rounded" />
      </div>
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <>
      <div aria-busy="true" className="flex flex-1 flex-col gap-5 px-6 pt-5 pb-6">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-[140px] rounded" />
            <Skeleton className="h-2.5 w-[90px] rounded" />
            <Skeleton className="h-4 w-[120px] rounded-full" />
          </div>
        </div>
        <SkeletonRows />
        <SkeletonRows />
        <SkeletonRows />
      </div>
      <footer className="flex items-center justify-between border-t border-[#eef1f2] bg-[#fafbfb] px-6 py-3.5">
        <Skeleton className="h-[30px] w-[70px] rounded-md" />
        <Skeleton className="h-[30px] w-24 rounded-md" />
      </footer>
    </>
  );
}
