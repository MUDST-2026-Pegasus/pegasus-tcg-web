import { Gavel } from "lucide-react";

import { cn } from "@/lib/utils";

import { auctionOrderLabel } from "../auction.format";

/** ป้าย "จากการประมูล #AUC-…" ในหน้า checkout / ชำระเงิน / ชำระสำเร็จ [TCG-631 · FE-5] */
export function AuctionOrderBadge({ auctionNumber, className }: { auctionNumber: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800",
        className,
      )}
    >
      <Gavel aria-hidden className="size-3.5" />
      {auctionOrderLabel(auctionNumber)}
    </span>
  );
}
