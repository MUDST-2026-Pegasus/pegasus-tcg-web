import { ConfirmDialog } from "@/components/common";
import type { ReactNode } from "react";

import { Trash2 } from "lucide-react";


import { taxonomyErrorMessage } from "../taxonomy.format";

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** รายละเอียดของสิ่งที่จะลบ เช่นจำนวนการ์ดที่ได้รับผล */
  children?: ReactNode;
  confirmLabel: string;
  isPending: boolean;
  /** ปิดปุ่มยืนยัน เช่นตอนยังโหลดตัวเลขไม่เสร็จ หรือรู้แล้วว่าลบไม่ได้ */
  confirmDisabled?: boolean;
  error: unknown;
  errorFallback: string;
  onConfirm: () => void;
};

/** ถามก่อนลบฟิลด์หรือชุดการ์ด — ลบแล้วกู้คืนไม่ได้ */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  isPending,
  confirmDisabled,
  error,
  errorFallback,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Trash2}
      variant="destructive"
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      isPending={isPending}
      confirmDisabled={confirmDisabled}
      error={error ? taxonomyErrorMessage(error, errorFallback) : null}
      onConfirm={onConfirm}
    >
      {children}
    </ConfirmDialog>
  );
}
