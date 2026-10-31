import type { ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PromotionDialogTone = "info" | "success" | "warning" | "danger";

const TONE_STYLE: Record<PromotionDialogTone, string> = {
  info: "bg-[#e8f1fc] text-[#0058bc]",
  success: "bg-[#e7f6ee] text-[#007a4a]",
  warning: "bg-[#fdf0dd] text-[#b45309]",
  danger: "bg-[#fde8e8] text-[#b42318]",
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
 * เปลือกเดียวของบอร์ด "Modals & Dialogs — Admin" (Figma PRM-M1):
 * ไอคอนในกรอบสี หัวข้อ คำอธิบาย เนื้อหา แล้ว footer เทาปุ่มชิดขวา
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={cn("promotion-dialog max-w-[420px] gap-0 overflow-hidden p-0", className)}>
        <div className="grid gap-3 p-6 pb-5">
          <span aria-hidden className={cn("promotion-modal-icon", TONE_STYLE[tone])}>
            {icon}
          </span>
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg leading-6 font-bold">{title}</DialogTitle>
            {description ? (
              <DialogDescription className="text-xs leading-[17px] text-muted-foreground">{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          {children}
        </div>
        <DialogFooter className="promotion-dialog-footer">
          {footerNote ? <span className="promotion-footer-note">{footerNote}</span> : null}
          {actions}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
