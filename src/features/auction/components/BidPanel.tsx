import { useState } from "react";
import { AlertTriangle, Gavel, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  BID_SHORTCUTS,
  canSubmitBid,
  clockOffset,
  formatAuctionDateTime,
  formatBaht,
  pillForStatus,
  remainingMs,
} from "../auction.format";
import type { AuctionDetail } from "../auction.types";
import { AuctionCountdown } from "./AuctionCountdown";
import { AuctionStatusPill } from "./AuctionStatusPill";

type BidPanelProps = {
  auction: AuctionDetail;
  /** กดปุ่มบิด → เปิด dialog ยืนยัน (ไม่ส่งบิดทันที) */
  onBid: (amount: number) => void;
  onShowHistory: () => void;
};

/**
 * กล่องบิดในหน้า B2 [TCG-629] — สถานะอื่น (นำอยู่ / ถูกแซง / บิดไม่ได้ / จบแล้ว) FE-4 มาเพิ่ม
 * ช่องราคาเริ่มที่ `minNextBid` (ราคาเริ่มต้นถ้ายังไม่มีบิด ไม่งั้นราคาปัจจุบัน + ขั้นบิด) และเดินตามจนกว่าผู้ใช้จะพิมพ์เอง ถ้าราคาขยับขึ้นจนค่าที่พิมพ์ต่ำกว่าขั้นต่ำ ปุ่มบิดจะกดไม่ได้
 */
export function BidPanel({ auction, onBid, onShowHistory }: BidPanelProps) {
  const [typed, setTyped] = useState<number | null>(null);
  const amount = typed ?? auction.minNextBid;
  const live = auction.status === "LIVE";
  const remaining = remainingMs(auction.endsAt, clockOffset(auction.serverTime));
  const valid = canSubmitBid(amount, auction.minNextBid, live);
  const buyNowClosed = auction.buyNowPrice !== null && auction.bidCount > 0;

  return (
    <section aria-label="กล่องบิด" className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <AuctionStatusPill kind={pillForStatus(auction.status, remaining)} />
        {live ? <AuctionCountdown target={auction.endsAt} serverTime={auction.serverTime} /> : null}
        <span className="ml-auto text-xs text-muted-foreground">
          ปิด {formatAuctionDateTime(auction.endsAt)}
          {auction.extensionCount > 0 ? ` · ต่อเวลาแล้ว ${auction.extensionCount} ครั้ง` : ""}
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">ราคาบิดสูงสุดตอนนี้</p>
          <p className="text-4xl font-bold tabular-nums">{formatBaht(auction.currentPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{auction.bidCount.toLocaleString("th-TH")} บิด · {auction.bidderCount.toLocaleString("th-TH")} ผู้บิด</p>
          <button type="button" onClick={onShowHistory} className="text-xs font-semibold text-primary hover:underline">
            ดูประวัติการบิด ↓
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 border-t pt-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">ราคาเริ่มต้น</dt><dd className="font-bold tabular-nums">{formatBaht(auction.startingPrice)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">บิดขั้นต่ำครั้งละ</dt><dd className="font-bold tabular-nums">+{formatBaht(auction.bidIncrement)}</dd></div>
        <div className="text-right"><dt className="text-xs text-muted-foreground">เปิดประมูลเมื่อ</dt><dd className="font-bold">{formatAuctionDateTime(auction.startedAt)}</dd></div>
      </dl>

      <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="bid-amount" className="font-bold">ราคาที่จะบิด</label>
          <span className="text-xs text-muted-foreground">ขั้นต่ำ {formatBaht(auction.minNextBid)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-40 flex-1">
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-muted-foreground">฿</span>
            <Input
              id="bid-amount"
              inputMode="numeric"
              value={Number.isFinite(amount) ? amount.toLocaleString("en-US") : ""}
              onChange={(event) => {
                const digits = event.target.value.replace(/[^\d]/g, "");
                setTyped(digits === "" ? Number.NaN : Number(digits));
              }}
              disabled={!live}
              aria-invalid={live && !valid}
              className="h-11 rounded-xl border-primary bg-background pl-7 text-base font-bold tabular-nums"
            />
          </div>
          {BID_SHORTCUTS.map((step) => (
            <Button
              key={step}
              type="button"
              variant="outline"
              disabled={!live}
              className="h-11 rounded-full bg-background px-4 font-semibold"
              onClick={() => setTyped((Number.isFinite(amount) ? amount : auction.minNextBid) + step)}
            >
              +{step.toLocaleString("en-US")}
            </Button>
          ))}
        </div>
        <Button type="button" className="h-12 w-full rounded-full text-base font-bold" disabled={!valid} onClick={() => onBid(amount)}>
          <Gavel aria-hidden />
          บิด {formatBaht(Number.isFinite(amount) ? amount : auction.minNextBid)}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-amber-800">
          <AlertTriangle aria-hidden className="size-3.5" />
          บิดแล้วถอนไม่ได้ · ถ้าชนะต้องชำระภายใน 24 ชม.
        </p>
      </div>

      {buyNowClosed ? (
        <p className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs text-muted-foreground")}>
          <Zap aria-hidden className="size-3.5" />
          ซื้อทันที {formatBaht(auction.buyNowPrice ?? 0)} ปิดแล้ว — ปุ่มนี้หายไปเมื่อมีผู้บิดคนแรก
        </p>
      ) : null}
    </section>
  );
}
