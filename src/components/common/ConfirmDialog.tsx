import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslate } from "@/lib/i18n";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** รายละเอียดเพิ่มเติมของสิ่งที่จะยืนยัน เช่นสรุปรายการ */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `destructive` สำหรับการกระทำที่ย้อนกลับไม่ได้ เช่น ลบ */
  variant?: "default" | "destructive";
  icon?: LucideIcon;
  isPending?: boolean;
  /** ปิดปุ่มยืนยัน เช่นตอนยังโหลดข้อมูลไม่เสร็จ */
  confirmDisabled?: boolean;
  /** ข้อความที่แปลงแล้ว — ฝั่งเรียกรู้ว่าจะแปลง error ของ API แบบไหน */
  error?: ReactNode;
  onConfirm: () => void;
};

/**
 * ถามยืนยันก่อนทำสิ่งที่มีผลจริง ไม่ปิดเองตอนกดยืนยัน
 * ฝั่งเรียกเป็นคนปิดเมื่อสำเร็จ เพื่อให้ dialog ค้างไว้แสดง error ได้ถ้าไม่สำเร็จ
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  variant = "default",
  icon: Icon,
  isPending = false,
  confirmDisabled,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslate();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // กัน Esc ปิดระหว่างรอผล ไม่งั้นผู้ใช้จะไม่เห็นว่าสำเร็จหรือไม่
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          {Icon ? (
            <AlertDialogMedia className={variant === "destructive" ? "text-destructive" : undefined}>
              <Icon />
            </AlertDialogMedia>
          ) : null}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        {children}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel ?? t("actions.cancel", "ยกเลิก")}</AlertDialogCancel>
          <Button variant={variant} disabled={isPending || confirmDisabled} onClick={onConfirm}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
