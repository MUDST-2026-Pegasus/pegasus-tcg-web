import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type PromotionDialogTone = "info" | "success" | "warning" | "danger";

const TONE_STYLE: Record<PromotionDialogTone, string> = {
  info: "bg-[#e8f1fc] text-[#0058bc]",
  success: "bg-[#e7f6ee] text-[#007a4a]",
  warning: "bg-[#fdf0dd] text-[#b45309]",
  danger: "bg-destructive/10 text-destructive",
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
 * เปลือกเดียวของบอร์ด "Modals & Dialogs — Admin" (Figma PRM-M1) บน `AlertDialog`
 * แบบเดียวกับ `ConfirmDeleteDialog`: ไอคอนในกรอบสี หัวข้อ คำอธิบาย เนื้อหา แล้วปุ่มชิดขวา
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
      <AlertDialogContent className={cn("gap-4 sm:max-w-[420px]", className)}>
        <AlertDialogHeader>
          <AlertDialogMedia className={cn("size-10 rounded-xl *:[svg:not([class*='size-'])]:size-5", TONE_STYLE[tone])}>
            {icon}
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription className="text-xs">{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className="items-center">
          {footerNote ? <span className="mr-auto text-[11px] text-muted-foreground">{footerNote}</span> : null}
          {actions}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
