import { cn } from "@/lib/utils";

import { AUCTION_PILL_LABEL, type AuctionPillKind } from "../auction.format";

/** สีของป้ายแต่ละแบบ ตาม Figma Components › AUC / Status Pill (พื้น / ตัวอักษร+จุด) */
const PILL_TONE: Record<AuctionPillKind, string> = {
  Live: "bg-sky-50 text-sky-700",
  EndingSoon: "bg-red-50 text-red-700",
  Leading: "bg-emerald-50 text-emerald-700",
  Outbid: "bg-amber-100 text-amber-800",
  Won: "bg-emerald-50 text-emerald-700",
  AwaitingPayment: "bg-amber-50 text-amber-800",
  Lost: "bg-slate-100 text-muted-foreground",
  Ended: "bg-slate-100 text-muted-foreground",
  Unsold: "bg-slate-100 text-muted-foreground",
  SecondChance: "bg-sky-50 text-sky-700",
  Suspended: "bg-red-50 text-red-700",
  NeedsDecision: "bg-amber-50 text-amber-800",
};

type AuctionStatusPillProps = {
  /** แปลงจากสถานะด้วย `pillForStatus` / `pillForViewer` ใน auction.format.ts */
  kind: AuctionPillKind;
  /** แทนข้อความมาตรฐาน เช่น "ขายแล้ว", "สูงสุด", "อันดับ 2" — สียังตาม kind */
  label?: string;
  className?: string;
};

/** ป้ายสถานะประมูลทรงแคปซูล มีจุดสีหน้าข้อความ [TCG-627] */
export function AuctionStatusPill({ kind, label, className }: AuctionStatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[19px] w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] leading-[13px] font-semibold whitespace-nowrap",
        PILL_TONE[kind],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label ?? AUCTION_PILL_LABEL[kind]}
    </span>
  );
}
