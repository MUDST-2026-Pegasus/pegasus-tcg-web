import { translate, useLanguage } from "@/lib/language";
import { useState } from "react";

import { ListRowsSkeleton } from "@/components/common/PageSkeletons";
import { ErrorState } from "@/components/common";

import { formatBaht, formatBidTime } from "../auction.format";
import { useBidHistory } from "../auction.queries";
import { AuctionStatusPill } from "./AuctionStatusPill";

/** แสดงก่อนกี่แถว — กด "ดูทั้งหมด" เพื่อดูที่เหลือ */
const PREVIEW_ROWS = 6;

type BidHistoryProps = {
  auctionId: number;
  bidCount: number;
  /** ป้าย "สูงสุดตอนนี้" ที่แถวแรก เฉพาะตอนประมูลยังเปิด */
  live: boolean;
};

/** "ประวัติการบิด" ใหม่สุดก่อน ชื่อผู้บิดถูกปิดบัง [TCG-629] */
export function BidHistory({ auctionId, bidCount, live }: BidHistoryProps) {
  useLanguage();
  const history = useBidHistory(auctionId);
  const [expanded, setExpanded] = useState(false);
  const bids = history.data?.page.items ?? [];
  const visible = expanded ? bids : bids.slice(0, PREVIEW_ROWS);

  return (
    <section id="bid-history" className="scroll-mt-24 rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-primary">{bidCount.toLocaleString("th-TH")}{translate("บิด", "Bid")}</p>
          <h2 className="text-lg font-bold">{translate("ประวัติการบิด", "Bid history")}</h2>
        </div>
        {!expanded && bids.length > PREVIEW_ROWS ? (
          <button type="button" onClick={() => setExpanded(true)} className="text-xs font-semibold text-primary hover:underline">{translate("ดูทั้งหมด", "View all")}</button>
        ) : null}
      </div>

      {history.isPending ? (
        <div role="status" aria-busy="true" aria-label={translate("กำลังโหลดประวัติการบิด", "Loading bid history")}><ListRowsSkeleton rows={4} /></div>
      ) : history.isError ? (
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      ) : bids.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{translate("ยังไม่มีการบิด", "No bids yet")}</p>
      ) : (
        <ol className="divide-y">
          {visible.map((bid, index) => (
            <li key={`${bid.placedAt}-${bid.amount}`} className="flex items-center gap-3 py-3">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                {bid.bidderInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{bid.bidderAlias}{bid.mine ? translate(" (คุณ)", " (you)") : ""}</p>
                <p className="text-xs text-muted-foreground">{formatBidTime(bid.placedAt)}</p>
              </div>
              {live && index === 0 ? <AuctionStatusPill kind="Leading" label={translate("สูงสุดตอนนี้", "Current highest")} /> : null}
              <span className="text-base font-bold tabular-nums">{formatBaht(bid.amount)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
