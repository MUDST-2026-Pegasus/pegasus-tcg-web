import type { ReactNode } from "react";

import { CircleX, RotateCw, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

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

function actionCopy(user: AdminUser, action: UserStatusAction): ActionCopy {
  const name = `@${user.username}`;
  switch (action) {
    case "suspend":
      return {
        tone: "danger",
        icon: <CircleX />,
        title: `ระงับบัญชี ${name}?`,
        description:
          "ผู้ใช้จะถูกออกจากระบบทุกอุปกรณ์ภายในไม่กี่นาที และเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง",
        confirm: "ระงับบัญชี",
        saving: "กำลังระงับ…",
        effects: [
          "เพิกถอน refresh token ทั้งหมดของบัญชีนี้ทันที",
          "ประกาศขายและคำสั่งซื้อเดิมไม่ถูกลบ",
          "เปิดใช้งานกลับได้ภายหลังจากเมนู ⋯",
        ],
      };
    case "deactivate":
      return {
        tone: "danger",
        icon: <UserX />,
        title: `ปิดบัญชี ${name}?`,
        description:
          "ผู้ใช้จะถูกออกจากระบบและเข้าใช้ไม่ได้อีก ใช้กับบัญชีที่ขอปิดหรือไม่ใช้งานแล้ว เปิดกลับได้ภายหลัง",
        confirm: "ปิดบัญชี",
        saving: "กำลังปิดบัญชี…",
      };
    case "restore":
      return {
        tone: "success",
        icon: <RotateCw />,
        title: `เปิดใช้งาน ${name} อีกครั้ง?`,
        description: "ผู้ใช้จะเข้าสู่ระบบและใช้งานได้ตามปกติ",
        confirm: "เปิดใช้งาน",
        saving: "กำลังเปิดใช้งาน…",
      };
  }
}

type UserStatusDialogProps = {
  user: AdminUser;
  action: UserStatusAction;
  onClose: () => void;
};

/** ยืนยันการเปลี่ยนสถานะ — ชุดเดียวกันทั้งจากเมนู ⋯ และปุ่มท้าย Sidebar */
export function UserStatusDialog({ user, action, onClose }: UserStatusDialogProps) {
  const updateStatus = useUpdateUserStatus();
  const copy = actionCopy(user, action);
  const saving = updateStatus.isPending;

  function confirm() {
    const status = NEXT_STATUS[action];
    updateStatus.mutate(
      { userId: user.id, status },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: `@${user.username} ${USER_STATUS_LABEL[status]}แล้ว`,
          });
          onClose();
        },
        onError: (error) =>
          toast.add({
            type: "error",
            title: "ทำรายการไม่สำเร็จ",
            description: userErrorMessage(error, "ลองใหม่อีกครั้ง"),
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
            ยกเลิก
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
