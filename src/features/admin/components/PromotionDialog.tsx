import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { PROMOTION_DIALOG_CONTROLS } from "../promotions.styles";

export type PromotionDialogTone = "info" | "success" | "warning" | "danger" | "teal";

const TONE_STYLE: Record<PromotionDialogTone, string> = {
  info: "bg-sky-50 text-primary",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-orange-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  teal: "bg-teal-50 text-teal-700",
};

type PromotionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tone: PromotionDialogTone;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** ข้อความเทาซ้ายของ footer เช่น "บันทึกใน Activity Log" */
  footerNote?: string;
  actions: ReactNode;
  className?: string;
};

/**
 * เปลือกเดียวของบอร์ด "Modals & Dialogs" (Figma PRM-M1 Admin / PRM-M2 Seller) บน `AlertDialog`:
 * กรอบไอคอนสีอยู่บนหัวข้อ คำอธิบาย เนื้อหา แล้ว footer เทาเต็มความกว้างที่ปุ่มชิดขวา
 */
export function PromotionDialog({
  open,
  onOpenChange,
  tone,
  icon,
  title,
  description,
  children,
  footerNote,
  actions,
  className,
}: PromotionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "max-h-[calc(100svh-2rem)] gap-0 overflow-hidden rounded-[12px] p-0 sm:max-w-[420px] flex flex-col",
          PROMOTION_DIALOG_CONTROLS,
          className,
        )}
      >
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-6 pt-6 pb-5.5">
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-[10px] [&_svg:not([class*='size-'])]:size-5",
              TONE_STYLE[tone],
            )}
          >
            {icon}
          </div>
          <div className="grid gap-1">
            <AlertDialogTitle className="text-lg leading-snug font-bold">{title}</AlertDialogTitle>
            {description ? (
              <AlertDialogDescription className="text-xs text-pretty">{description}</AlertDialogDescription>
            ) : null}
          </div>
          {children}
        </div>
        <AlertDialogFooter className="shrink-0 items-center border-t border-border bg-muted/40 px-6 py-3.5">
          {footerNote ? <span className="text-[11px] text-muted-foreground sm:mr-auto">{footerNote}</span> : null}
          {actions}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
