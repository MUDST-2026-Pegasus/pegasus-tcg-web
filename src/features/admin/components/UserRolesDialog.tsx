import { useState } from "react";

import { Lock, Shield, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { ROLE_LABEL, userErrorMessage } from "../users.format";
import { type RoleChange, useUpdateRoles } from "../users.queries";
import type { AdminUser, RoleCode } from "../users.types";
import { RoleBadge, UserSummary } from "./UserBadges";
import { EffectList, USER_DANGER_BUTTON, UserDialog } from "./UserDialog";

type RoleRow = {
  role: RoleCode;
  description: string;
  /** ล็อกไว้ แก้จากที่นี่ไม่ได้ พร้อมเหตุผลสั้น ๆ บนชิป */
  locked?: string;
};

const EDITABLE: RoleCode[] = ["SUPPORT", "ADMIN"];

type UserRolesDialogProps = {
  user: AdminUser;
  /** แอดมินที่ login อยู่ — ถอน ADMIN ตัวเองไม่ได้ (backend ตอบ 403) */
  currentUserId: number | null;
  onClose: () => void;
};

/**
 * "จัดการบทบาท" — BUYER/SELLER ล็อก, SUPPORT/ADMIN เป็น switch
 * กดบันทึกแล้วยิงเฉพาะที่เปลี่ยน ถ้ามีการเปิด/ปิด ADMIN ต้องผ่านหน้า confirm ก่อน
 */
export function UserRolesDialog({ user, currentUserId, onClose }: UserRolesDialogProps) {
  const { t } = useTranslate("admin");
  const updateRoles = useUpdateRoles();
  const [draft, setDraft] = useState<RoleCode[]>(user.roles);
  const [confirming, setConfirming] = useState(false);
  const saving = updateRoles.isPending;
  const isSelf = user.id === currentUserId;

  const roleRows: RoleRow[] = [
    { role: "BUYER", description: t("users.roles.buyerDesc", "ทุกบัญชีได้อัตโนมัติตอนสมัคร"), locked: t("users.roles.defaultLocked", "ค่าเริ่มต้น") },
    {
      role: "SELLER",
      description: t("users.roles.sellerDesc", "ได้จากการอนุมัติ KYC ที่หน้า “อนุมัติผู้ขาย” ไม่ได้ให้จากที่นี่"),
      locked: t("users.roles.fromApprovalLocked", "จากการอนุมัติ"),
    },
    { role: "SUPPORT", description: t("users.roles.supportDesc", "บทบาททีมช่วยเหลือ — ให้/ถอนได้ที่หน้านี้เท่านั้น") },
    {
      role: "ADMIN",
      description: t("users.roles.adminDesc", "เข้าหลังบ้านได้ทุกหน้า รวมถึงอนุมัติผู้ขาย แก้ค่าคอม และระงับบัญชีผู้อื่น"),
    },
  ];

  const changes: RoleChange[] = EDITABLE.filter(
    (role) => draft.includes(role) !== user.roles.includes(role),
  ).map((role) => ({ role, grant: draft.includes(role) }));
  const adminChange = changes.find((change) => change.role === "ADMIN");

  function toggle(role: RoleCode, on: boolean) {
    setDraft((current) => (on ? [...current, role] : current.filter((value) => value !== role)));
  }

  function getRolesSuccessTitle(user: AdminUser, changes: RoleChange[]): string {
    const name = `@${user.username}`;
    if (changes.length === 1 && changes[0].role === "ADMIN") {
      return changes[0].grant
        ? t("users.roles.grantSuccess", "ตั้ง {name} เป็นผู้ดูแลแล้ว", { name })
        : t("users.roles.revokeSuccess", "ถอนสิทธิ์ผู้ดูแลของ {name} แล้ว", { name });
    }
    return t("users.roles.saveSuccess", "บันทึกบทบาทของ {name} แล้ว", { name });
  }

  function getFooterNote(count: number, adminChange: RoleChange | undefined): string {
    if (count === 0) {
      return t("users.roles.noChanges", "ยังไม่มีการเปลี่ยนแปลง");
    }
    if (!adminChange) {
      return t("users.roles.changedCount", "เปลี่ยน {count} รายการ", { count });
    }
    return adminChange.grant
      ? t("users.roles.changedGrantConfirm", "เปลี่ยน {count} รายการ · ให้สิทธิ์ผู้ดูแลจะถามยืนยันอีกครั้ง", { count })
      : t("users.roles.changedRevokeConfirm", "เปลี่ยน {count} รายการ · ถอนสิทธิ์ผู้ดูแลจะถามยืนยันอีกครั้ง", { count });
  }

  function save() {
    updateRoles.mutate(
      { userId: user.id, changes },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: getRolesSuccessTitle(user, changes) });
          onClose();
        },
        onError: (error) => {
          setConfirming(false);
          toast.add({
            type: "error",
            title: t("users.roles.failedTitle", "ทำรายการไม่สำเร็จ"),
            description: userErrorMessage(error, t("actions.retry", "ลองใหม่", { ns: "common" })),
          });
        },
      },
    );
  }

  if (confirming && adminChange) {
    return (
      <AdminRoleConfirmDialog
        user={user}
        grant={adminChange.grant}
        saving={saving}
        onCancel={() => setConfirming(false)}
        onConfirm={save}
      />
    );
  }

  return (
    <UserDialog
      open
      wide
      saving={saving}
      onClose={onClose}
      tone="info"
      icon={<Shield />}
      title={t("users.roles.dialogTitle", "จัดการบทบาท @{username}", { username: user.username })}
      description={t("users.roles.dialogDesc", "บทบาทใหม่มีผลเมื่อผู้ใช้ต่ออายุการเข้าสู่ระบบครั้งถัดไป ไม่ใช่ทันที")}
      footerNote={getFooterNote(changes.length, adminChange)}
      actions={
        <>
          <Button variant="outline" size="sm" disabled={saving} onClick={onClose}>
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button
            size="sm"
            disabled={saving || changes.length === 0}
            onClick={() => (adminChange ? setConfirming(true) : save())}
          >
            {saving && <Spinner data-icon="inline-start" />}
            {t("actions.save", "บันทึก", { ns: "common" })}
          </Button>
        </>
      }
    >
      <UserSummary user={user} />
      <ul className="flex flex-col gap-2">
        {roleRows.map(({ role, description, locked }) => {
          const changed = changes.some((change) => change.role === role);
          const selfAdmin = isSelf && role === "ADMIN";
          const switchId = `role-switch-${role}`;
          return (
            <li
              key={role}
              className={cn(
                "flex items-center gap-3 rounded-[10px] border border-muted px-3.5 py-3",
                changed && "border-[#0058bc] bg-[#f5f9fe]",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <div className="flex items-center gap-1.5">
                  <RoleBadge role={role} />
                  {changed ? (
                    <span className="text-[10px] font-medium text-[#0058bc]">{t("users.roles.changedBadge", "เปลี่ยนแล้ว")}</span>
                  ) : null}
                </div>
                <p id={`${switchId}-desc`} className="text-[11px] leading-[15px] text-muted-foreground">
                  {selfAdmin ? t("users.roles.cannotRemoveOwnAdmin", "ถอนสิทธิ์ผู้ดูแลของบัญชีตัวเองไม่ได้") : description}
                </p>
              </div>
              {locked ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#f1f3f4] px-2 py-[3px] text-[10px] font-medium text-muted-foreground">
                  <Lock aria-hidden="true" className="size-[11px]" />
                  {locked}
                </span>
              ) : (
                <Switch
                  id={switchId}
                  aria-label={ROLE_LABEL[role]}
                  aria-describedby={`${switchId}-desc`}
                  checked={draft.includes(role)}
                  disabled={saving || selfAdmin}
                  onCheckedChange={(on) => toggle(role, on)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </UserDialog>
  );
}

type AdminRoleConfirmDialogProps = {
  user: AdminUser;
  grant: boolean;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** ยืนยัน "ตั้งเป็นผู้ดูแล" / "ถอนสิทธิ์ผู้ดูแล" — ใช้ทั้งจาก dialog บทบาทและ "เพิ่มผู้ดูแล" */
export function AdminRoleConfirmDialog({
  user,
  grant,
  saving,
  onCancel,
  onConfirm,
}: AdminRoleConfirmDialogProps) {
  const { t } = useTranslate("admin");
  const name = `@${user.username}`;
  return (
    <UserDialog
      open
      saving={saving}
      onClose={onCancel}
      tone={grant ? "info" : "danger"}
      icon={grant ? <Shield /> : <ShieldOff />}
      title={
        grant
          ? t("users.roles.confirmGrantTitle", "ตั้ง {name} เป็นผู้ดูแล?", { name })
          : t("users.roles.confirmRevokeTitle", "ถอนสิทธิ์ผู้ดูแลของ {name}?", { name })
      }
      description={
        grant
          ? t("users.roles.confirmGrantDesc", "จะเข้าหลังบ้านได้ทุกหน้า รวมถึงอนุมัติผู้ขาย แก้ค่าคอม และระงับบัญชีผู้อื่น มีผลเมื่อผู้ใช้ต่ออายุการเข้าสู่ระบบครั้งถัดไป")
          : t("users.roles.confirmRevokeDesc", "จะเข้าหลังบ้านไม่ได้อีก มีผลเมื่อผู้ใช้ต่ออายุการเข้าสู่ระบบครั้งถัดไป")
      }
      actions={
        <>
          <Button variant="outline" size="sm" disabled={saving} onClick={onCancel}>
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button
            size="sm"
            className={grant ? undefined : USER_DANGER_BUTTON}
            disabled={saving}
            onClick={onConfirm}
          >
            {saving && <Spinner data-icon="inline-start" />}
            {grant ? t("users.roles.grantAction", "ตั้งเป็นผู้ดูแล") : t("users.roles.revokeAction", "ถอนสิทธิ์")}
          </Button>
        </>
      }
    >
      <UserSummary user={user} />
      {grant ? (
        <EffectList
          tone="info"
          items={[
            t("users.roles.grantEffect1", "ให้สิทธิ์เฉพาะคนที่ทีมรู้จักและยืนยันตัวตนแล้ว"),
            t("users.roles.grantEffect2", "ถอนสิทธิ์ได้ภายหลังจาก “จัดการบทบาท”"),
          ]}
        />
      ) : null}
    </UserDialog>
  );
}
