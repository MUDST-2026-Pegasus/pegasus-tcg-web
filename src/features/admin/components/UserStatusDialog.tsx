import type { ReactNode } from "react";

import { CircleX, RotateCw, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useTranslate } from "@/lib/i18n";

import { USER_STATUS_LABEL, userErrorMessage } from "../users.format";
import { useUpdateUserStatus } from "../users.queries";
import type { AdminUser, UserStatus } from "../users.types";
import { UserSummary } from "./UserBadges";
import { EffectList, USER_DANGER_BUTTON, UserDialog, type UserDialogTone } from "./UserDialog";

export type UserStatusAction = "suspend" | "deactivate" | "restore";

const NEXT_STATUS: Record<UserStatusAction, UserStatus> = {
  suspend: "SUSPENDED",
  deactivate: "DEACTIVATED",
  restore: "ACTIVE",
};

type ActionCopy = {
  tone: UserDialogTone;
  icon: ReactNode;
  title: string;
  description: string;
  confirm: string;
  saving: string;
  effects?: string[];
};

type UserStatusDialogProps = {
  user: AdminUser;
  action: UserStatusAction;
  onClose: () => void;
};

/** ยืนยันการเปลี่ยนสถานะ — ชุดเดียวกันทั้งจากเมนู ⋯ และปุ่มท้าย Sidebar */
export function UserStatusDialog({ user, action, onClose }: UserStatusDialogProps) {
  const { t } = useTranslate("admin");
  const updateStatus = useUpdateUserStatus();
  const saving = updateStatus.isPending;
  const name = `@${user.username}`;

  const copy: ActionCopy = (() => {
    switch (action) {
      case "suspend":
        return {
          tone: "danger",
          icon: <CircleX />,
          title: t("users.status.suspendTitle", "ระงับบัญชี {name}?", { name }),
          description: t(
            "users.status.suspendDesc",
            "ผู้ใช้จะถูกออกจากระบบทุกอุปกรณ์ภายในไม่กี่นาที และเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง",
          ),
          confirm: t("users.status.suspendConfirm", "ระงับบัญชี"),
          saving: t("users.status.suspendSaving", "กำลังระงับ…"),
          effects: [
            t("users.status.suspendEffect1", "เพิกถอน refresh token ทั้งหมดของบัญชีนี้ทันที"),
            t("users.status.suspendEffect2", "ประกาศขายและคำสั่งซื้อเดิมไม่ถูกลบ"),
            t("users.status.suspendEffect3", "เปิดใช้งานกลับได้ภายหลังจากเมนู ⋯"),
          ],
        };
      case "deactivate":
        return {
          tone: "danger",
          icon: <UserX />,
          title: t("users.status.deactivateTitle", "ปิดบัญชี {name}?", { name }),
          description: t(
            "users.status.deactivateDesc",
            "ผู้ใช้จะถูกออกจากระบบและเข้าใช้ไม่ได้อีก ใช้กับบัญชีที่ขอปิดหรือไม่ใช้งานแล้ว เปิดกลับได้ภายหลัง",
          ),
          confirm: t("users.status.deactivateConfirm", "ปิดบัญชี"),
          saving: t("users.status.deactivateSaving", "กำลังปิดบัญชี…"),
        };
      case "restore":
        return {
          tone: "success",
          icon: <RotateCw />,
          title: t("users.status.restoreTitle", "เปิดใช้งาน {name} อีกครั้ง?", { name }),
          description: t("users.status.restoreDesc", "ผู้ใช้จะเข้าสู่ระบบและใช้งานได้ตามปกติ"),
          confirm: t("users.status.restoreConfirm", "เปิดใช้งาน"),
          saving: t("users.status.restoreSaving", "กำลังเปิดใช้งาน…"),
        };
    }
  })();

  function confirm() {
    const status = NEXT_STATUS[action];
    updateStatus.mutate(
      { userId: user.id, status },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: t("users.status.successToast", "@{username} {status}แล้ว", {
              username: user.username,
              status: USER_STATUS_LABEL[status],
            }),
          });
          onClose();
        },
        onError: (error) =>
          toast.add({
            type: "error",
            title: t("users.status.failedTitle", "ทำรายการไม่สำเร็จ"),
            description: userErrorMessage(error, t("actions.retry", "ลองใหม่", { ns: "common" })),
          }),
      },
    );
  }

  return (
    <UserDialog
      open
      saving={saving}
      onClose={onClose}
      tone={copy.tone}
      icon={copy.icon}
      title={copy.title}
      description={copy.description}
      actions={
        <>
          <Button variant="outline" size="sm" disabled={saving} onClick={onClose}>
            {t("actions.cancel", "ยกเลิก", { ns: "common" })}
          </Button>
          <Button
            size="sm"
            className={copy.tone === "danger" ? USER_DANGER_BUTTON : undefined}
            disabled={saving}
            onClick={confirm}
          >
            {saving && <Spinner data-icon="inline-start" />}
            {saving ? copy.saving : copy.confirm}
          </Button>
        </>
      }
    >
      <UserSummary user={user} />
      {copy.effects ? <EffectList tone="warning" items={copy.effects} /> : null}
    </UserDialog>
  );
}
