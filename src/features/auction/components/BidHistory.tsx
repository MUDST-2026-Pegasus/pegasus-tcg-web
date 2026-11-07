import { useState } from "react";

import { ListRowsSkeleton } from "@/components/common/PageSkeletons";
import { ErrorState } from "@/components/common";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";

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
  const history = useBidHistory(auctionId);
  const [expanded, setExpanded] = useState(false);
  const bids = history.data?.page.items ?? [];
  const visible = expanded ? bids : bids.slice(0, PREVIEW_ROWS);

  return (
    <section id="bid-history" className="scroll-mt-24 rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-primary">{bidCount.toLocaleString("th-TH")} บิด</p>
          <h2 className="text-lg font-bold">ประวัติการบิด</h2>
        </div>
        {!expanded && bids.length > PREVIEW_ROWS ? (
          <button type="button" onClick={() => setExpanded(true)} className="text-xs font-semibold text-primary hover:underline">
            ดูทั้งหมด
          </button>
        ) : null}
      </div>

      {history.isPending ? (
        <div role="status" aria-busy="true" aria-label="กำลังโหลดประวัติการบิด"><ListRowsSkeleton rows={4} /></div>
      ) : history.isError ? (
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      ) : bids.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีการบิด</p>
      ) : (
        <ol className="divide-y">
          {visible.map((bid, index) => (
            <Item key={`${bid.placedAt}-${bid.amount}`} render={<li />} className="flex-nowrap gap-3 rounded-none px-0 py-3">
              <ItemMedia aria-hidden className="size-9 rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                {bid.bidderInitials}
              </ItemMedia>
              <ItemContent className="min-w-0 gap-0">
                <ItemTitle className="block w-full truncate font-semibold">{bid.bidderAlias}{bid.mine ? " (คุณ)" : ""}</ItemTitle>
                <ItemDescription className="text-xs">{formatBidTime(bid.placedAt)}</ItemDescription>
              </ItemContent>
              <ItemActions className="shrink-0 gap-3">
                {live && index === 0 ? <AuctionStatusPill kind="Leading" label="สูงสุดตอนนี้" /> : null}
                <span className="text-base font-bold tabular-nums">{formatBaht(bid.amount)}</span>
              </ItemActions>
            </Item>
          ))}
        </ol>
      )}
    </section>
  );
}
