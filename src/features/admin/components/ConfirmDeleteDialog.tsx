import type { ReactNode } from "react";

import { Trash2 } from "lucide-react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {taxonomyErrorMessage(error, errorFallback)}
            </AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending || confirmDisabled}
            onClick={onConfirm}
          >
            {isPending && <Spinner data-icon="inline-start" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
