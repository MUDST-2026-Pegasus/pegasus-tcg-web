import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONE_CLASS = {
  warning: "bg-orange-100/70 text-amber-700",
  info: "bg-primary/10 text-primary",
} as const;

type CalloutProps = {
  tone: keyof typeof TONE_CLASS;
  icon: LucideIcon;
  children: ReactNode;
};

/** แถบข้อความสั้น ๆ มีไอคอนนำหน้า — ใช้เตือนหรือให้ข้อมูลประกอบฟอร์ม */
export function Callout({ tone, icon: Icon, children }: CalloutProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-[11px]",
        TONE_CLASS[tone],
      )}
    >
      <Icon aria-hidden className="size-3.75 shrink-0" />
      <p className="flex-1">{children}</p>
    </div>
  );
}
