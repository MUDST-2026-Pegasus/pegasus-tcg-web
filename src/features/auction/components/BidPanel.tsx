import { translate, useLanguage } from "@/lib/language";
import { useState, type ReactNode } from "react";
import { AlertTriangle, Ban, Clock, Gavel, Info, Lock, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { EMAIL_NOT_VERIFIED_MESSAGE } from "../auction.errors";
import {
  BID_SHORTCUTS,
  canSubmitBid,
  clockOffset,
  formatAuctionDate,
  formatAuctionDateTime,
  formatAuctionShortDateTime,
  formatBaht,
  formatBidCount,
  pillForStatus,
  remainingMs,
  type AuctionPillKind,
} from "../auction.format";
import type { AuctionDetail } from "../auction.types";
import { canBidInState, type BidPanelState } from "../bid-panel.state";
import { AuctionCountdown } from "./AuctionCountdown";
import { AuctionNotice } from "./AuctionNotice";
import { AuctionStatusPill } from "./AuctionStatusPill";
import { PriceSummary } from "./PriceSummary";

type BidPanelProps = {
  auction: AuctionDetail;
  /** จาก `resolveBidPanelState()` */
  state: BidPanelState;
  /** กดปุ่มบิด → เปิด dialog ยืนยัน (ไม่ส่งบิดทันที) */
  onBid: (amount: number) => void;
  onBuyNow: () => void;
  onShowHistory: () => void;
};

/**
 * กล่องบิดในหน้า B2 ครบทุกสถานะของ B3 (B, F) + B4 (A–H) [TCG-629 · TCG-630]
 * ช่องราคาเริ่มที่ `minNextBid` และเดินตามจนกว่าผู้ใช้จะพิมพ์เอง ถ้าราคาขยับขึ้นจนค่าที่พิมพ์ต่ำกว่าขั้นต่ำ ปุ่มบิดจะกดไม่ได้
 */
export function BidPanel({ auction, state, onBid, onBuyNow, onShowHistory }: BidPanelProps) {
  useLanguage();
  if (state === "WON_AWAITING_PAYMENT") return <WonPanel auction={auction} />;

  const live = auction.status === "LIVE";
  return (
    <section aria-label={translate("กล่องบิด", "Bidding panel")} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <PanelHeader auction={auction} state={state} />
      <PriceBlock auction={auction} state={state} onShowHistory={onShowHistory} />
      {canBidInState(state) ? (
        <BidForm auction={auction} state={state} onBid={onBid} onBuyNow={onBuyNow} />
      ) : (
        <StateBody auction={auction} state={state} />
      )}
      {live && canBidInState(state) && auction.buyNowPrice !== null && auction.bidCount > 0 ? (
        <p className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs text-muted-foreground">
          <Zap aria-hidden className="size-3.5" />{translate("ซื้อทันที", "Buy now")}{formatBaht(auction.buyNowPrice)}{translate("ปิดแล้ว — ปุ่มนี้หายไปเมื่อมีผู้บิดคนแรก", "Closed — this option disappears after the first bid")}</p>
      ) : null}
    </section>
  );
}

/** ป้าย (+ ข้อความแทน) ของกล่องที่จบแล้ว ตาม B4-D/E/F/G */
function endedPill(auction: AuctionDetail, state: BidPanelState): { kind: AuctionPillKind; label?: string } | null {
  switch (state) {
    case "AWAITING_PAYMENT":
      return { kind: "AwaitingPayment", label: translate("จบแล้ว · รอชำระ", "Ended · Awaiting payment") };
    case "SOLD":
      return { kind: "Ended", label: translate("ขายแล้ว", "Sold") };
    case "UNSOLD":
      return { kind: "Unsold", label: auction.bidCount > 0 ? translate("ไม่มีผู้ชำระ", "No payment") : translate("ไม่มีผู้บิด", "No bids") };
    case "SUSPENDED":
      return { kind: "Suspended" };
    default:
      return null;
  }
}

function PanelHeader({ auction, state }: { auction: AuctionDetail; state: BidPanelState }) {
  useLanguage();
  const ended = endedPill(auction, state);
  if (ended) return <AuctionStatusPill kind={ended.kind} label={ended.label} />;

  const remaining = remainingMs(auction.endsAt, clockOffset(auction.serverTime));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AuctionStatusPill kind={pillForStatus(auction.status, remaining)} />
      <AuctionCountdown target={auction.endsAt} serverTime={auction.serverTime} />
      <span className="ml-auto text-xs text-muted-foreground">{translate("ปิด", "Close")}{formatAuctionDateTime(auction.endsAt)}
        {auction.extensionCount > 0 ? translate(` · ต่อเวลาแล้ว ${auction.extensionCount} ครั้ง`, ` · Extended ${auction.extensionCount} times`) : ""}
      </span>
    </div>
  );
}

function PriceBlock({ auction, state, onShowHistory }: { auction: AuctionDetail; state: BidPanelState; onShowHistory: () => void }) {
  useLanguage();
  let label = translate("ราคาบิดสูงสุดตอนนี้", "Current highest bid");
  let price = auction.currentPrice;
  let sub: ReactNode = translate(`${auction.bidCount.toLocaleString("th-TH")} บิด · ${auction.bidderCount.toLocaleString("th-TH")} ผู้บิด`, `${auction.bidCount.toLocaleString("en-GB")} bids · ${auction.bidderCount.toLocaleString("en-GB")} bidders`);
  let history = auction.bidCount > 0;

  switch (state) {
    case "OPEN_BUY_NOW":
      label = translate("ราคาเริ่มต้น · ยังไม่มีผู้บิด", "Starting price · No bids yet");
      sub = null;
      break;
    case "AWAITING_PAYMENT":
      label = translate("ราคาปิด", "Closing price");
      sub = [auction.winnerAlias ? translate(`ผู้ชนะ ${auction.winnerAlias}`, `Winner ${auction.winnerAlias}`) : null, formatBidCount(auction.bidCount)].filter(Boolean).join(" · ");
      break;
    case "SOLD":
      label = translate("ราคาปิด", "Closing price");
      sub = translate(`ปิด ${formatAuctionShortDateTime(auction.endsAt)} · ${formatBidCount(auction.bidCount)}`, `Closed ${formatAuctionShortDateTime(auction.endsAt)} · ${formatBidCount(auction.bidCount)}`);
      break;
    case "UNSOLD":
      label = translate("ราคาเริ่มต้น", "Starting price");
      price = auction.startingPrice;
      sub = translate(`${auction.bidCount > 0 ? formatBidCount(auction.bidCount) : translate("ไม่มีผู้บิด", "No bids")} · ปิด ${formatAuctionDate(auction.endsAt)}`, `${auction.bidCount > 0 ? formatBidCount(auction.bidCount) : translate("ไม่มีผู้บิด", "No bids")} · Closed ${formatAuctionDate(auction.endsAt)}`);
      history = false;
      break;
    case "SUSPENDED":
      label = translate("ราคาก่อนถูกระงับ", "Price before suspension");
      sub = null;
      history = false;
      break;
    default:
      if (auction.bidCount === 0) label = translate("ราคาเริ่มต้น · ยังไม่มีผู้บิด", "Starting price · No bids yet");
  }

  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-4xl font-bold tabular-nums">{formatBaht(price)}</p>
        {sub ? <p className="mt-1 text-sm font-semibold">{sub}</p> : null}
      </div>
      {history ? (
        <button type="button" onClick={onShowHistory} className="text-xs font-semibold text-primary hover:underline">{translate("ดูประวัติการบิด ↓", "View bid history ↓")}</button>
      ) : null}
    </div>
  );
}

/** กล่องบิดปกติ (B2) + ปุ่มซื้อทันทีตอนยังไม่มีบิด (B3-B) */
function BidForm({ auction, state, onBid, onBuyNow }: { auction: AuctionDetail; state: BidPanelState; onBid: (amount: number) => void; onBuyNow: () => void }) {
  useLanguage();
  const [typed, setTyped] = useState<number | null>(null);
  const amount = typed ?? auction.minNextBid;
  const valid = canSubmitBid(amount, auction.minNextBid, auction.status === "LIVE");

  return (
    <>
      <dl className="grid grid-cols-3 gap-2 border-t pt-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">{translate("ราคาเริ่มต้น", "Starting price")}</dt><dd className="font-bold tabular-nums">{formatBaht(auction.startingPrice)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{translate("บิดขั้นต่ำครั้งละ", "Minimum bid increment")}</dt><dd className="font-bold tabular-nums">+{formatBaht(auction.bidIncrement)}</dd></div>
        <div className="text-right"><dt className="text-xs text-muted-foreground">{translate("เปิดประมูลเมื่อ", "Auction opened")}</dt><dd className="font-bold">{formatAuctionDateTime(auction.startedAt)}</dd></div>
      </dl>

      <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="bid-amount" className="font-bold">{translate("ราคาที่จะบิด", "Your bid amount")}</label>
          <span className="text-xs text-muted-foreground">{translate("ขั้นต่ำ", "Minimum")}{formatBaht(auction.minNextBid)}</span>
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
              aria-invalid={!valid}
              className="h-11 rounded-xl border-primary bg-background pl-7 text-base font-bold tabular-nums"
            />
          </div>
          {BID_SHORTCUTS.map((step) => (
            <Button
              key={step}
              type="button"
              variant="outline"
              className="h-11 rounded-full bg-background px-4 font-semibold"
              onClick={() => setTyped((Number.isFinite(amount) ? amount : auction.minNextBid) + step)}
            >
              +{step.toLocaleString("en-US")}
            </Button>
          ))}
        </div>
        <Button type="button" className="h-12 w-full rounded-full text-base font-bold" disabled={!valid} onClick={() => onBid(amount)}>
          <Gavel aria-hidden />{translate("บิด", "Bid")}{formatBaht(Number.isFinite(amount) ? amount : auction.minNextBid)}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-amber-800">
          <AlertTriangle aria-hidden className="size-3.5" />{translate("บิดแล้วถอนไม่ได้ · ถ้าชนะต้องชำระภายใน 24 ชม.", "Bids cannot be withdrawn · Winners must pay within 24 hours")}</p>
      </div>

      {state === "OPEN_BUY_NOW" && auction.buyNowPrice !== null ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="h-12 w-full rounded-full bg-amber-100 text-base font-bold text-amber-900 hover:bg-amber-200"
            onClick={onBuyNow}
          >
            <Zap aria-hidden />{translate("ซื้อทันที", "Buy now")}{formatBaht(auction.buyNowPrice)}
          </Button>
          <p className="text-xs text-muted-foreground">{translate("ปุ่ม \"ซื้อทันที\" จะหายไปเมื่อมีผู้บิดคนแรก (แบบ eBay) — หลังจากนั้นเป็นประมูลปกติจนหมดเวลา", "Buy now disappears after the first bid (eBay style) — bidding then continues until the auction ends")}</p>
        </div>
      ) : null}
    </>
  );
}

/** เนื้อหากล่องตอนบิดไม่ได้ (B4) */
function StateBody({ auction, state }: { auction: AuctionDetail; state: BidPanelState }) {
  useLanguage();
  const wide = "h-12 w-full rounded-full text-base font-bold";
  switch (state) {
    case "GUEST":
      return (
        <div className="flex flex-col gap-3">
          <Button className={wide} nativeButton={false} render={<Link to={`/login?returnTo=${encodeURIComponent(`/auctions/${auction.id}`)}`} />}>{translate("เข้าสู่ระบบเพื่อบิด", "Log in to bid")}</Button>
          <p className="text-xs text-muted-foreground">{translate("ยังไม่มีบัญชี?", "Don't have an account?")}{" "}
            <Link to={`/register?returnTo=${encodeURIComponent(`/auctions/${auction.id}`)}`} className="font-semibold text-primary hover:underline">{translate("สมัครสมาชิก", "Sign up")}</Link>{" "}{translate("— ต้องยืนยันอีเมลและเพิ่มที่อยู่ก่อนบิด", "— Verify your email and add an address before bidding")}</p>
        </div>
      );
    case "NEEDS_ADDRESS":
      return (
        <div className="flex flex-col gap-3">
          <AuctionNotice
            tone="amber"
            icon={<Info />}
            title={translate("อีกขั้นเดียวก่อนบิด", "One more step before bidding")}
            detail={translate("เพิ่มที่อยู่จัดส่งอย่างน้อย 1 ที่ เพื่อให้ผู้ขายส่งของได้ทันทีถ้าคุณชนะ", "Add at least one shipping address so the seller can ship your card if you win")}
          />
          <Button className={wide} nativeButton={false} render={<Link to="/account/addresses" />}>{translate("เพิ่มที่อยู่จัดส่ง", "Add shipping address")}</Button>
        </div>
      );
    case "NEEDS_EMAIL":
      return <AuctionNotice tone="amber" icon={<Info />} title={EMAIL_NOT_VERIFIED_MESSAGE.title} detail={EMAIL_NOT_VERIFIED_MESSAGE.detail} />;
    case "OWN_AUCTION":
      return (
        <div className="flex flex-col gap-3">
          <AuctionNotice tone="sky" icon={<Lock />} title={translate("นี่คือประมูลของร้านคุณ", "This is your store's auction")} detail="ผู้ขายบิดประมูลของตัวเองไม่ได้" />
          <Button variant="outline" className={wide} nativeButton={false} render={<Link to={`/seller/auctions/${auction.id}`} />}>{translate("จัดการประมูลนี้", "Manage this auction")}</Button>
        </div>
      );
    case "BANNED":
      return (
        <div className="flex flex-col gap-3">
          <AuctionNotice
            tone="red"
            icon={<Ban />}
            title={auction.viewer?.bannedUntil ? translate(`คุณถูกห้ามบิดถึง ${formatAuctionDate(auction.viewer.bannedUntil)}`, `You are suspended from bidding until ${formatAuctionDate(auction.viewer.bannedUntil)}`) : translate("คุณถูกห้ามบิด", "You are suspended from bidding")}
            detail={translate("ไม่ชำระเงินหลังชนะครบ 3 ครั้ง · ยังซื้อสินค้าปกติได้", "Three unpaid auction wins · Regular purchases are still available")}
          />
          <Button className={`${wide} bg-slate-100 text-muted-foreground`} disabled>{translate("บิด", "Bid")}</Button>
        </div>
      );
    case "AWAITING_PAYMENT":
      return (
        <AuctionNotice
          tone="slate"
          icon={<Clock />}
          title={translate("ประมูลนี้ปิดรับบิดแล้ว", "This auction is no longer accepting bids")}
          detail={translate("ถ้าผู้ชนะไม่ชำระใน 24 ชม. ประมูลจะถูกยกเลิก และการ์ดกลับเข้าสต็อกผู้ขาย", "If the winner does not pay within 24 hours, the auction is cancelled and the card returns to the seller's stock")}
        />
      );
    case "SOLD":
      return (
        <div className="flex flex-col gap-3">
          <Button variant="outline" className={wide} nativeButton={false} render={<Link to={`/products/${encodeURIComponent(auction.item.card.productSlug)}`} />}>{translate("ดูการ์ดนี้ในตลาด", "View this card in the marketplace")}</Button>
          <Button variant="outline" className={wide} nativeButton={false} render={<Link to="/auctions" />}>{translate("ดูประมูลอื่นที่เปิดอยู่", "View other open auctions")}</Button>
        </div>
      );
    case "UNSOLD":
      return (
        <Button variant="outline" className={wide} nativeButton={false} render={<Link to={`/u/${encodeURIComponent(auction.seller.username)}`} />}>{translate("ดูการ์ดนี้ในหน้าร้าน", "View this card in the store")}</Button>
      );
    case "SUSPENDED":
      return (
        <AuctionNotice
          tone="red"
          icon={<Ban />}
          title={translate("ประมูลนี้ถูกระงับ", "This auction has been suspended")}
          detail={translate(`${auction.suspendReason ? `เหตุผล: ${auction.suspendReason} · ` : ""}บิดทั้งหมดถูกยกเลิก ไม่มีผู้ชนะ`, `${auction.suspendReason ? `Reason: ${auction.suspendReason} · ` : ""}All bids were cancelled. There is no winner.`)}
        />
      );
    default:
      return null;
  }
}

/** B3-F ชนะแล้ว → ชำระเงินภายใน 24 ชม. ผ่าน checkout โหมดประมูล */
function WonPanel({ auction }: { auction: AuctionDetail }) {
  useLanguage();
  const total = auction.currentPrice + auction.shippingFee;
  const dueAt = auction.viewer?.paymentDueAt ?? null;
  return (
    <section aria-label={translate("กล่องบิด", "Bidding panel")} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <AuctionStatusPill kind="Won" />
        {dueAt ? <AuctionCountdown target={dueAt} serverTime={auction.serverTime} prefix={translate("ชำระภายใน", "Pay within")} tone="urgent" /> : null}
      </div>
      <div className="flex items-start gap-3">
        <Trophy aria-hidden className="mt-0.5 size-6 shrink-0 text-emerald-700" />
        <div>
          <p className="text-lg font-bold">{translate("คุณชนะประมูล!", "You won the auction!")}</p>
          <p className="text-sm text-muted-foreground">
            {auction.item.card.productName}{translate("· ราคาปิด", "· Closing price")}{formatBaht(auction.currentPrice)}
          </p>
        </div>
      </div>
      <PriceSummary
        rows={[
          [translate("ราคาชนะ", "Winning price"), auction.currentPrice],
          [translate("ค่าจัดส่ง", "Shipping"), auction.shippingFee],
        ]}
        totalLabel={translate("ยอดชำระ", "Total payment")}
        total={total}
      />
      <Button className="h-12 w-full rounded-full text-base font-bold" nativeButton={false} render={<Link to={`/checkout?auction=${auction.id}`} />}>{translate("ชำระเงิน", "Checkout")}{formatBaht(total)}
      </Button>
      <p className="text-xs text-muted-foreground">{translate("ใช้ขั้นตอนชำระเงินเดิม (โอน + แนบสลิป / PromptPay) · ไม่ชำระใน 24 ชม. คำสั่งซื้อถูกยกเลิก และถูกบันทึกไม่ชำระ 1 ครั้ง", "Use the regular checkout (bank transfer with payment slip / PromptPay) · If payment is not made within 24 hours, the order is cancelled and one non-payment strike is recorded")}</p>
    </section>
  );
}
