import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type NoticeTone = "emerald" | "amber" | "sky" | "slate" | "red";

/** สีกล่องข้อความตาม Figma B3-D / B3-E / B4 */
const TONE: Record<NoticeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-800",
  amber: "bg-amber-50 text-amber-800",
  sky: "bg-sky-50 text-sky-800",
  slate: "bg-slate-100 text-slate-600",
  red: "bg-red-50 text-red-700",
};

type AuctionNoticeProps = {
  tone: NoticeTone;
  icon: ReactNode;
  title: string;
  detail?: ReactNode;
  /** ปุ่มชิดขวา เช่น "บิด THB 8,750" ในแบนเนอร์ถูกบิดแซง */
  action?: ReactNode;
  /** `alert` ใช้กับ error */
  role?: "alert" | "status";
  className?: string;
};

/** กล่องข้อความไอคอนซ้าย หัวข้อตัวหนา + รายละเอียด ในหน้าประมูล [TCG-630 · FE-4] */
export function AuctionNotice({ tone, icon, title, detail, action, role = "status", className }: AuctionNoticeProps) {
  return (
    <div role={role} className={cn("flex items-center gap-3 rounded-xl px-4 py-3", TONE[tone], className)}>
      <span aria-hidden className="shrink-0 [&_svg]:size-5">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-bold">{title}</p>
        {detail ? <p className="text-xs">{detail}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
