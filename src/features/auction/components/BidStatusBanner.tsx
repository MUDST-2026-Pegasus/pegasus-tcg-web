import { translate, useLanguage } from "@/lib/language";
import { CircleCheck, Clock, Gavel, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

import { URGENT_THRESHOLD_MS, formatBaht, formatBidCount, formatRemaining } from "../auction.format";
import type { AuctionDetail, BidPlaced } from "../auction.types";
import { useCountdown } from "../useCountdown";
import { AuctionNotice } from "./AuctionNotice";

type BidStatusBannerProps = {
  auction: AuctionDetail;
  /** ผลบิดล่าสุดในหน้านี้ — แสดง "คุณนำอยู่" ทันทีไม่ต้องรอ refetch */
  lastBid: BidPlaced | null;
  onBid: (amount: number) => void;
};

/** B3-D แบนเนอร์เหนือกล่องบิด: นำอยู่ / ถูกแซง / ต่อเวลาแล้ว / จบแล้วไม่ชนะ [TCG-630 · FE-4] */
export function BidStatusBanner({ auction, lastBid, onBid }: BidStatusBannerProps) {
  useLanguage();
  const live = auction.status === "LIVE";
  const remaining = useCountdown(live ? auction.endsAt : null, auction.serverTime) ?? 0;
  const viewerState = auction.viewer?.state ?? null;

  if (!live) {
    if (viewerState !== "LOST") return null;
    return (
      <AuctionNotice
        tone="slate"
        icon={<Gavel />}
        title={translate("ประมูลจบแล้ว — คุณไม่ชนะ", "Auction ended — you did not win")}
        detail={translate(`ราคาปิด ${formatBaht(auction.currentPrice)} · ${formatBidCount(auction.bidCount)}`, `Closing price ${formatBaht(auction.currentPrice)} · ${formatBidCount(auction.bidCount)}`)}
      />
    );
  }

  // บิดในหน้านี้แล้วยังไม่มีบิดใหม่กว่า → เชื่อผลบิดล่าสุดก่อนข้อมูลที่ยังไม่ refetch
  const freshBid = lastBid !== null && lastBid.bidCount >= auction.bidCount ? lastBid : null;
  const leading = freshBid ? freshBid.leading : viewerState === "LEADING";
  const outbid = freshBid ? !freshBid.leading : viewerState === "OUTBID";
  const extended = (auction.extensionCount > 0 || freshBid?.extended === true) && remaining > 0 && remaining <= URGENT_THRESHOLD_MS;

  return (
    <>
      {leading ? (
        <AuctionNotice
          tone="emerald"
          icon={<CircleCheck />}
          title={translate(`คุณนำอยู่ที่ ${formatBaht(freshBid?.amount ?? auction.viewer?.myHighestBid ?? auction.currentPrice)}`, `You are leading at ${formatBaht(freshBid?.amount ?? auction.viewer?.myHighestBid ?? auction.currentPrice)}`)}
          detail={translate("ถ้ามีคนบิดแซง เราจะแจ้งในหน้า \"การประมูลของฉัน\"", "If someone outbids you, we will show it on the My auctions page")}
        />
      ) : null}
      {outbid ? (
        <AuctionNotice
          tone="amber"
          icon={<TriangleAlert />}
          title={translate("คุณถูกบิดแซงแล้ว", "You have been outbid")}
          detail={translate(`ราคาตอนนี้ ${formatBaht(freshBid?.currentPrice ?? auction.currentPrice)}`, `Current price ${formatBaht(freshBid?.currentPrice ?? auction.currentPrice)}`)}
          action={
            <Button className="rounded-full px-4" onClick={() => onBid(freshBid?.minNextBid ?? auction.minNextBid)}>{translate("บิด", "Bid")}{formatBaht(freshBid?.minNextBid ?? auction.minNextBid)}
            </Button>
          }
        />
      ) : null}
      {extended ? (
        <AuctionNotice
          tone="sky"
          icon={<Clock />}
          title={translate(`ต่อเวลาแล้ว — เหลือ ${formatRemaining(remaining)}`, `Extended — ${formatRemaining(remaining)} remaining`)}
          detail={translate("มีคนบิดในช่วง 2 นาทีสุดท้าย เวลาจึงกลับเป็น 2 นาที", "A bid in the final 2 minutes reset the timer to 2 minutes")}
        />
      ) : null}
    </>
  );
}
