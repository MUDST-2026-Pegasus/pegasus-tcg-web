import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

import { conditionAndShop, formatBaht, formatBidCount, priceLabel } from "../auction.format";
import type { AuctionSummary } from "../auction.types";
import { AuctionCountdown } from "./AuctionCountdown";

type AuctionCardProps = {
  auction: AuctionSummary;
  /** `serverTime` ของหน้ารายการ ให้ตัวนับทุกใบตรงกัน */
  serverTime?: string;
  className?: string;
};

/**
 * การ์ดประมูลในหน้ารวม ตาม Figma Components › AUC / Auction Card (กว้าง 240px ใน grid) [TCG-627]
 * รูป + ตัวนับมุมซ้ายบน → ชื่อ → สภาพ · ร้าน → ราคา + จำนวนบิด → แถบซื้อทันที (ถ้ายังซื้อได้)
 */
export function AuctionCard({ auction, serverTime, className }: AuctionCardProps) {
  const { item } = auction;
  return (
    <Link
      to={`/auctions/${auction.id}`}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <div className="rounded-xl bg-slate-50 p-2.5">
        <div className="relative aspect-square w-full overflow-hidden">
          {item.card.officialImageUrl ? (
            <img
              src={item.card.officialImageUrl}
              alt={item.card.productName}
              className="size-full object-contain"
              loading="lazy"
            />
          ) : null}
          <AuctionCountdown target={auction.endsAt} serverTime={serverTime} className="absolute top-0 left-0" />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-sm leading-[17px] font-bold text-foreground">{item.card.productName}</p>
        <p className="truncate text-xs leading-[15px] text-muted-foreground">
          {conditionAndShop(item.condition, auction.shopName)}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] leading-[13px] text-muted-foreground">{priceLabel(auction.bidCount)}</span>
          <span className="text-xl leading-6 font-bold text-primary tabular-nums">
            {formatBaht(auction.currentPrice)}
          </span>
        </div>
        <span className="text-xs leading-[15px] font-medium text-muted-foreground">
          {formatBidCount(auction.bidCount)}
        </span>
      </div>

      {auction.buyNowPrice !== null ? (
        <div className="flex items-center gap-1.5 rounded-[10px] bg-amber-50 px-2.5 py-1.5 text-xs leading-[15px] text-amber-800">
          <span className="font-semibold">ซื้อทันที</span>
          <span className="font-bold tabular-nums">{formatBaht(auction.buyNowPrice)}</span>
        </div>
      ) : null}
    </Link>
  );
}
