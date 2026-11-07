import { translate, useLanguage } from "@/lib/language";
import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  formatAuctionShortDateTime,
  formatBaht,
  formatBidCount,
  isBiddingState,
  myAuctionActions,
  myAuctionPill,
  type MyAuctionAction,
} from "../auction.format";
import type { MyAuction } from "../auction.types";
import { AuctionCountdown } from "./AuctionCountdown";
import { AuctionStatusPill } from "./AuctionStatusPill";

type MyAuctionRowProps = {
  auction: MyAuction;
  /** `serverTime` ของหน้า ให้ตัวนับทุกแถวตรงกัน */
  serverTime?: string;
};

/**
 * หนึ่งแถวใน "การประมูลของฉัน" (W1) [TCG-631 · FE-5]
 * หัวสีเทาอ่อน (รหัส · เวลาปิด · ตัวนับ · ป้าย) → รูป + ชื่อ + ราคา → แถบปุ่ม (ตามแบบ Order History)
 */
export function MyAuctionRow({ auction, serverTime }: MyAuctionRowProps) {
  useLanguage();
  const { state, item } = auction;
  const toPay = state === "WON_AWAITING_PAYMENT";
  const actions = myAuctionActions(state);

  return (
    <Card
      data-state={state}
      className={cn("gap-0 overflow-hidden rounded-xl border py-0 shadow-none", toPay && "border-amber-600")}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-4 rounded-none border-b bg-muted/40 px-4 py-3">
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">{translate("ประมูล", "AUCTION")}</p>
            <p className="text-sm font-semibold">#{auction.auctionNumber}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">{isBiddingState(state) ? translate("ปิด", "Close") : "ปิดเมื่อ"}</p>
            <p className="text-sm font-semibold">
              {isBiddingState(state) && auction.extended ? translate("ต่อเวลาอยู่", "Extended") : formatAuctionShortDateTime(auction.endsAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <RowCountdown auction={auction} serverTime={serverTime} />
          <AuctionStatusPill kind={myAuctionPill(state)} />
        </div>
      </CardHeader>

      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-[75px] w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
          {item.card.officialImageUrl ? (
            <img src={item.card.officialImageUrl} alt={item.card.productName} className="size-full object-cover" loading="lazy" />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-base font-semibold text-foreground">{item.card.productName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.condition} · {auction.shopName} · {formatBidCount(auction.bidCount)}
          </p>
          {toPay ? (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
              <TriangleAlert aria-hidden className="size-3.5 shrink-0" />{translate("ไม่ชำระใน 24 ชม. = คำสั่งซื้อถูกยกเลิก และถูกบันทึกไม่ชำระ 1 ครั้ง", "No payment within 24 hours = order cancellation and one non-payment strike")}</p>
          ) : null}
        </div>
        <RowPrice auction={auction} />
      </CardContent>

      {actions.length > 0 ? (
        <CardFooter className="flex justify-end gap-3 rounded-none border-t px-4 py-3">
          {actions.map((action) => (
            <RowButton key={action} action={action} auction={auction} primary={action === "PAY" || action === "BID"} />
          ))}
        </CardFooter>
      ) : null}
    </Card>
  );
}

function RowCountdown({ auction, serverTime }: MyAuctionRowProps) {
  useLanguage();
  if (auction.state === "WON_AWAITING_PAYMENT" && auction.deadline) {
    return <AuctionCountdown target={auction.deadline} serverTime={serverTime} prefix={translate("ชำระภายใน", "Pay within")} tone="urgent" />;
  }
  if (isBiddingState(auction.state)) {
    return <AuctionCountdown target={auction.endsAt} serverTime={serverTime} prefix="" />;
  }
  return null;
}

/** ราคาขวาของแถวตามตารางสถานะในการ์ด FE-5 */
function RowPrice({ auction }: { auction: MyAuction }) {
  useLanguage();
  const { state } = auction;
  const big = "text-2xl font-bold tabular-nums";
  const small = "text-xs text-muted-foreground tabular-nums";
  const label = "text-xs text-muted-foreground";

  let content: ReactNode;
  switch (state) {
    case "WON_AWAITING_PAYMENT":
      content = (
        <>
          <span className={label}>{translate("ยอดชำระ (รวมส่ง)", "Total payment (including shipping)")}</span>
          <span className={cn(big, "text-primary")}>{formatBaht(auction.totalDue ?? auction.currentPrice + auction.shippingFee)}</span>
          <span className={small}>{translate("ราคาชนะ", "Winning price")}{formatBaht(auction.currentPrice)}</span>
        </>
      );
      break;
    case "LEADING":
      content = (
        <>
          <span className={label}>{translate("บิดของคุณ (สูงสุด)", "Your highest bid")}</span>
          <span className={cn(big, "text-emerald-700")}>{formatBaht(auction.myHighestBid)}</span>
        </>
      );
      break;
    case "OUTBID":
      content = (
        <>
          <span className={label}>{translate("ราคาตอนนี้", "Current price")}</span>
          <span className={cn(big, "text-foreground")}>{formatBaht(auction.currentPrice)}</span>
          <span className={small}>{translate("บิดของคุณ", "Your bid")}{formatBaht(auction.myHighestBid)}</span>
        </>
      );
      break;
    case "WON":
      content = (
        <>
          <span className={label}>{translate("ราคาชนะ", "Winning price")}</span>
          <span className={cn(big, "text-foreground")}>{formatBaht(auction.currentPrice)}</span>
        </>
      );
      break;
    case "LOST":
      content = (
        <>
          <span className={label}>{translate("ราคาปิด", "Closing price")}</span>
          <span className={cn(big, "text-foreground")}>{formatBaht(auction.currentPrice)}</span>
          <span className={small}>{translate("บิดสูงสุดของคุณ", "Your highest bid")}{formatBaht(auction.myHighestBid)}</span>
        </>
      );
      break;
  }
  return <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">{content}</div>;
}

function RowButton({ action, auction, primary }: { action: MyAuctionAction; auction: MyAuction; primary: boolean }) {
  useLanguage();
  const { to, label } = buttonTarget(action, auction);
  return (
    <Button
      variant={primary ? "default" : "outline"}
      size="sm"
      className="rounded-full px-4"
      nativeButton={false}
      render={<Link to={to} />}
    >
      {label}
    </Button>
  );
}

function buttonTarget(action: MyAuctionAction, auction: MyAuction): { to: string; label: string } {
  switch (action) {
    case "VIEW_AUCTION":
      return { to: `/auctions/${auction.id}`, label: translate("ดูประมูล", "View auction") };
    case "PAY":
      return { to: `/checkout?auction=${auction.id}`, label: translate("ชำระเงิน", "Checkout") };
    case "BID":
      return { to: `/auctions/${auction.id}`, label: translate(`บิด ${formatBaht(auction.minNextBid ?? auction.currentPrice)}`, `Bid ${formatBaht(auction.minNextBid ?? auction.currentPrice)}`) };
    case "VIEW_ORDER":
      return { to: auction.orderId ? `/account/orders?orderId=${auction.orderId}` : "/account/orders", label: translate("ดูคำสั่งซื้อ", "View order") };
  }
}
