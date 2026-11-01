import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

import { URGENT_THRESHOLD_MS, formatRemaining } from "../auction.format";
import { useCountdown } from "../useCountdown";

export type CountdownTone = "normal" | "urgent" | "warning";

/** สีตาม Figma Components › AUC / Countdown */
const TONE: Record<CountdownTone, string> = {
  normal: "bg-secondary text-foreground",
  urgent: "bg-red-50 text-red-700",
  warning: "bg-amber-100 text-amber-800",
};

type AuctionCountdownProps = {
  /** เวลาที่นับไปหา เช่น `endsAt`, `paymentDueAt`, `decideBy`, `offer.expiresAt` */
  target: string;
  /** `serverTime` จาก response เดียวกับ target — ใช้ชดเชยนาฬิกาเครื่อง */
  serverTime?: string;
  /** ข้อความหน้าเวลา: "เหลือ" (ค่าเริ่มต้น), "ชำระภายใน", "ตอบภายใน", "เลือกใน" */
  prefix?: string;
  /**
   * `warning` ใช้กับเวลาที่ผู้ขาย/ผู้ซื้อต้องตัดสินใจ (สีเหลืองตลอด)
   * ถ้าไม่ส่ง: เป็น normal และเปลี่ยนเป็น urgent เองเมื่อเหลือ < 2 นาที
   */
  tone?: "warning";
  /** ข้อความเมื่อหมดเวลา */
  endedLabel?: string;
  className?: string;
};

/** ตัวนับถอยหลังทรงแคปซูล เดินทุกวินาที [TCG-627] */
export function AuctionCountdown({
  target,
  serverTime,
  prefix = "เหลือ",
  tone,
  endedLabel = "หมดเวลา",
  className,
}: AuctionCountdownProps) {
  const remaining = useCountdown(target, serverTime) ?? 0;
  const resolved: CountdownTone = tone ?? (remaining < URGENT_THRESHOLD_MS ? "urgent" : "normal");

  return (
    <span
      role="timer"
      className={cn(
        "inline-flex h-[23px] w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs leading-[15px] font-semibold whitespace-nowrap tabular-nums",
        TONE[resolved],
        className,
      )}
    >
      <Clock aria-hidden className="size-[13px]" />
      {remaining > 0 ? `${prefix} ${formatRemaining(remaining)}` : endedLabel}
    </span>
  );
}
