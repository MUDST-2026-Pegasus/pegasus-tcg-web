import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type UserDialogTone = "danger" | "success" | "info";

const TONE_STYLE: Record<UserDialogTone, string> = {
  danger: "bg-[#fbe9e8] text-[#d0342c]",
  success: "bg-[#e3f4ec] text-[#12805c]",
  info: "bg-[#e8f1fc] text-[#0058bc]",
};

/** ปุ่มยืนยันที่ทำลายข้อมูลในบอร์ดนี้เป็นแดงทึบ ไม่ใช่แดงจางของ `variant="destructive"` */
export const USER_DANGER_BUTTON = "bg-destructive text-white hover:bg-destructive/90";

type UserDialogProps = {
  open: boolean;
  /** ระหว่างบันทึก Esc / คลิกด้านนอกจะไม่ปิด dialog */
  saving?: boolean;
  onClose: () => void;
  tone: UserDialogTone;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** ข้อความเทาซ้ายของ footer */
  footerNote?: ReactNode;
  actions: ReactNode;
  /** dialog บทบาท / เพิ่มผู้ดูแลกว้าง 460 ที่เหลือ 420 */
  wide?: boolean;
};

/**
 * เปลือกของ dialog ทุกอันในหน้าจัดการผู้ใช้ (Figma "จัดการผู้ใช้ · Dialogs & States")
 * กรอบไอคอนสี → หัวข้อ + คำอธิบาย → เนื้อหา → footer เทาเต็มความกว้าง ปุ่มชิดขวา
 */
export function UserDialog({
  open,
  saving = false,
  onClose,
  tone,
  icon,
  title,
  description,
  children,
  footerNote,
  actions,
  wide = false,
}: UserDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      <AlertDialogContent
        className={cn(
          "flex max-h-[calc(100svh-2rem)] flex-col gap-0 overflow-hidden rounded-[14px] p-0",
          "**:data-[slot=button]:rounded-md",
          wide ? "sm:max-w-[460px]" : "sm:max-w-[420px]",
        )}
      >
        <div className="flex min-h-0 flex-col gap-3.5 overflow-y-auto px-6 pt-6 pb-5">
          <div
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-[11px] [&_svg:not([class*='size-'])]:size-5",
              TONE_STYLE[tone],
            )}
          >
            {icon}
          </div>
          <div className="grid gap-[7px]">
            <AlertDialogTitle className="text-[17px] leading-snug font-bold text-foreground">
              {title}
            </AlertDialogTitle>
            {description ? (
              <AlertDialogDescription className="text-xs leading-[18px] text-pretty text-muted-foreground">
                {description}
              </AlertDialogDescription>
            ) : null}
          </div>
          {children}
        </div>
        <AlertDialogFooter className="shrink-0 items-center gap-2.5 border-t border-[#eef1f2] bg-[#fafbfb] px-6 py-4">
          {footerNote ? (
            <span className="text-[10px] leading-[14px] text-[#9aa5ad] sm:mr-auto">
              {footerNote}
            </span>
          ) : null}
          {actions}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** กล่องรายการผลที่จะเกิด (bullet) — เหลืองสำหรับคำเตือน ฟ้าสำหรับข้อแนะนำ */
export function EffectList({ tone, items }: { tone: "warning" | "info"; items: string[] }) {
  return (
    <ul
      className={cn(
        "flex flex-col gap-1.5 rounded-[10px] px-3 py-2.5 text-[11px] leading-4",
        tone === "warning" ? "bg-[#fdf6ec] text-[#8a4b08]" : "bg-[#eef5fd] text-[#0b4a99]",
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-1.5">
          <span aria-hidden="true" className="font-bold">
            •
          </span>
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}
