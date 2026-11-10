import { useState, type ReactNode } from "react";
import { AlertTriangle, Ban, Clock, Gavel, Info, Lock, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { EMAIL_NOT_VERIFIED_MESSAGE } from "../auction.errors";
import {
  auctionRules,
  BID_SHORTCUTS,
  canSubmitBid,
  clockOffset,
  formatAuctionDate,
  formatAuctionDateTime,
  formatAuctionShortDateTime,
  formatBaht,
  formatBidCount,
  formatPaymentWindow,
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
import { intlLocale, useTranslate, translate } from "@/lib/i18n";

// eslint-disable-next-line no-restricted-syntax -- ฿ คือสัญลักษณ์สกุลเงิน (format เงินเป็นงาน I18N-02)
const BAHT_SIGN = "฿";

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
  const { t } = useTranslate("auction");
  if (state === "WON_AWAITING_PAYMENT") return <WonPanel auction={auction} />;

  const live = auction.status === "LIVE";
  return (
    <section aria-label={t("buyer.bidPanel.ariaLabel", "กล่องบิด")} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <PanelHeader auction={auction} state={state} />
      <PriceBlock auction={auction} state={state} onShowHistory={onShowHistory} />
      {canBidInState(state) ? (
        <BidForm auction={auction} state={state} onBid={onBid} onBuyNow={onBuyNow} />
      ) : (
        <StateBody auction={auction} state={state} />
      )}
      {live && canBidInState(state) && auction.buyNowPrice !== null && auction.bidCount > 0 ? (
        <p className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs text-muted-foreground">
          <Zap aria-hidden className="size-3.5" />
          {t("buyer.bidPanel.text", "ซื้อทันที")}{" "}{formatBaht(auction.buyNowPrice)} {t("buyer.bidPanel.text2", "ปิดแล้ว — ปุ่มนี้หายไปเมื่อมีผู้บิดคนแรก")}
        </p>
      ) : null}
    </section>
  );
}

/** ป้าย (+ ข้อความแทน) ของกล่องที่จบแล้ว ตาม B4-D/E/F/G */
function endedPill(auction: AuctionDetail, state: BidPanelState): { kind: AuctionPillKind; label?: string } | null {
  switch (state) {
    case "CLOSING":
      return { kind: "Ended", label: translate("auction", "buyer.bidPanel.label", "หมดเวลา · กำลังสรุปผล") };
    case "AWAITING_PAYMENT":
      return { kind: "AwaitingPayment", label: translate("auction", "buyer.bidPanel.label2", "จบแล้ว · รอชำระ") };
    case "SOLD":
      return { kind: "Ended", label: translate("auction", "buyer.bidPanel.label3", "ขายแล้ว") };
    case "UNSOLD":
      // ซื้อทันทีแล้วไม่จ่ายไม่มีบิด แต่มีผู้ชนะ — ดู `winnerAlias` ด้วย [TCG-639]
      return { kind: "Unsold", label: auction.bidCount > 0 || auction.winnerAlias ? translate("auction", "buyer.bidPanel.text3", "ไม่มีผู้ชำระ") : translate("auction", "buyer.bidPanel.text4", "ไม่มีผู้บิด") };
    case "SUSPENDED":
      return { kind: "Suspended" };
    default:
      return null;
  }
}

function PanelHeader({ auction, state }: { auction: AuctionDetail; state: BidPanelState }) {
  const { t } = useTranslate("auction");
  const ended = endedPill(auction, state);
  if (ended) return <AuctionStatusPill kind={ended.kind} label={ended.label} />;

  const remaining = remainingMs(auction.endsAt, clockOffset(auction.serverTime));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AuctionStatusPill kind={pillForStatus(auction.status, remaining)} />
      <AuctionCountdown target={auction.endsAt} serverTime={auction.serverTime} />
      <span className="ml-auto text-xs text-muted-foreground">
        {t("buyer.bidPanel.text5", "ปิด")}{" "}{formatAuctionDateTime(auction.endsAt)}
        {auction.extensionCount > 0 ? t("buyer.bidPanel.text6", " · ต่อเวลาแล้ว {extensionCount} ครั้ง", { extensionCount: auction.extensionCount }) : ""}
      </span>
    </div>
  );
}

function PriceBlock({ auction, state, onShowHistory }: { auction: AuctionDetail; state: BidPanelState; onShowHistory: () => void }) {
  const { t } = useTranslate("auction");
  let label = t("buyer.bidPanel.text7", "ราคาบิดสูงสุดตอนนี้");
  let price = auction.currentPrice;
  let sub: ReactNode = t("buyer.bidPanel.text8", "{bidCount} บิด · {bidderCount} ผู้บิด", { bidCount: auction.bidCount.toLocaleString(intlLocale()), bidderCount: auction.bidderCount.toLocaleString(intlLocale()) });
  let history = auction.bidCount > 0;

  switch (state) {
    case "OPEN_BUY_NOW":
      label = t("buyer.bidPanel.text9", "ราคาเริ่มต้น · ยังไม่มีผู้บิด");
      sub = null;
      break;
    case "AWAITING_PAYMENT":
      label = t("buyer.bidPanel.text10", "ราคาปิด");
      sub = [auction.winnerAlias ? t("buyer.bidPanel.text11", "ผู้ชนะ {winnerAlias}", { winnerAlias: auction.winnerAlias }) : null, formatBidCount(auction.bidCount)].filter(Boolean).join(" · ");
      break;
    case "SOLD":
      label = t("buyer.bidPanel.text10", "ราคาปิด");
      sub = t("buyer.bidPanel.text12", "ปิด {endsAt} · {bidCount}", { endsAt: formatAuctionShortDateTime(auction.endsAt), bidCount: formatBidCount(auction.bidCount) });
      break;
    case "UNSOLD":
      label = t("buyer.bidPanel.text13", "ราคาเริ่มต้น");
      price = auction.startingPrice;
      sub = t("buyer.bidPanel.text14", "{value} · ปิด {endsAt}", { value: auction.bidCount > 0 ? formatBidCount(auction.bidCount) : auction.winnerAlias ? t("buyer.bidPanel.winnerUnpaid", "ผู้ชนะไม่ชำระ") : t("buyer.bidPanel.noBidders", "ไม่มีผู้บิด"), endsAt: formatAuctionDate(auction.endsAt) });
      history = false;
      break;
    case "SUSPENDED":
      label = t("buyer.bidPanel.text15", "ราคาก่อนถูกระงับ");
      sub = null;
      history = false;
      break;
    default:
      if (auction.bidCount === 0) label = t("buyer.bidPanel.text9", "ราคาเริ่มต้น · ยังไม่มีผู้บิด");
  }

  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-4xl font-bold tabular-nums">{formatBaht(price)}</p>
        {sub ? <p className="mt-1 text-sm font-semibold">{sub}</p> : null}
      </div>
      {history ? (
        <button type="button" onClick={onShowHistory} className="text-xs font-semibold text-primary hover:underline">
          {t("buyer.bidPanel.text16", "ดูประวัติการบิด ↓")}
        </button>
      ) : null}
    </div>
  );
}

/** กล่องบิดปกติ (B2) + ปุ่มซื้อทันทีตอนยังไม่มีบิด (B3-B) */
function BidForm({ auction, state, onBid, onBuyNow }: { auction: AuctionDetail; state: BidPanelState; onBid: (amount: number) => void; onBuyNow: () => void }) {
  const { t } = useTranslate("auction");
  const [typed, setTyped] = useState<number | null>(null);
  // ขั้นต่ำขยับ (เราหรือคนอื่นบิด) และค่าที่พิมพ์ต่ำกว่าขั้นต่ำใหม่ → กลับไปเดินตามขั้นต่ำ ไม่ต้องลบพิมพ์ใหม่เอง
  const [seenMin, setSeenMin] = useState(auction.minNextBid);
  if (seenMin !== auction.minNextBid) {
    setSeenMin(auction.minNextBid);
    if (typed !== null && !(typed >= auction.minNextBid)) setTyped(null);
  }
  const amount = typed ?? auction.minNextBid;
  const valid = canSubmitBid(amount, auction.minNextBid, auction.status === "LIVE");

  return (
    <>
      <dl className="grid grid-cols-3 gap-2 border-t pt-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">{t("buyer.bidPanel.text13", "ราคาเริ่มต้น")}</dt><dd className="font-bold tabular-nums">{formatBaht(auction.startingPrice)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{t("buyer.bidPanel.text17", "บิดขั้นต่ำครั้งละ")}</dt><dd className="font-bold tabular-nums">+{formatBaht(auction.bidIncrement)}</dd></div>
        <div className="text-right"><dt className="text-xs text-muted-foreground">{t("buyer.bidPanel.text18", "เปิดประมูลเมื่อ")}</dt><dd className="font-bold">{formatAuctionDateTime(auction.startedAt)}</dd></div>
      </dl>

      <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="bid-amount" className="font-bold">{t("buyer.bidPanel.text19", "ราคาที่จะบิด")}</label>
          <span className="text-xs text-muted-foreground">{t("buyer.bidPanel.text20", "ขั้นต่ำ")}{" "}{formatBaht(auction.minNextBid)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-40 flex-1">
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-muted-foreground">{BAHT_SIGN}</span>
            <Input
              id="bid-amount"
              inputMode="numeric"
              value={Number.isFinite(amount) ? amount.toLocaleString("en-US") /* ไม่ขึ้นกับภาษา: ค่าในช่อง input ต้อง parse กลับได้ */ : ""}
              onChange={(event) => {
                // ไม่เกิน 9 หลัก (< 1 พันล้าน) กันพิมพ์เลขยาวจนเกินค่าที่ส่งได้
                const digits = event.target.value.replace(/[^\d]/g, "").slice(0, 9);
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
              +{step.toLocaleString(intlLocale())}
            </Button>
          ))}
        </div>
        <Button type="button" className="h-12 w-full rounded-full text-base font-bold" disabled={!valid} onClick={() => onBid(amount)}>
          <Gavel aria-hidden />
          {t("buyer.bidPanel.text21", "บิด")}{" "}{formatBaht(Number.isFinite(amount) ? amount : auction.minNextBid)}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-amber-800">
          <AlertTriangle aria-hidden className="size-3.5" />
          {t("buyer.bidPanel.text22", "บิดแล้วถอนไม่ได้ · ถ้าชนะต้องชำระภายใน")}{" "}{formatPaymentWindow(auctionRules(auction).paymentHours)}
        </p>
      </div>

      {state === "OPEN_BUY_NOW" && auction.buyNowPrice !== null ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="h-12 w-full rounded-full bg-amber-100 text-base font-bold text-amber-900 hover:bg-amber-200"
            onClick={onBuyNow}
          >
            <Zap aria-hidden />
            {t("buyer.bidPanel.text", "ซื้อทันที")}{" "}{formatBaht(auction.buyNowPrice)}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("buyer.bidPanel.text23", "ปุ่ม \"ซื้อทันที\" จะหายไปเมื่อมีผู้บิดคนแรก (แบบ eBay) — หลังจากนั้นเป็นประมูลปกติจนหมดเวลา")}
          </p>
        </div>
      ) : null}
    </>
  );
}

/** เนื้อหากล่องตอนบิดไม่ได้ (B4) */
function StateBody({ auction, state }: { auction: AuctionDetail; state: BidPanelState }) {
  const { t } = useTranslate("auction");
  const wide = "h-12 w-full rounded-full text-base font-bold";
  switch (state) {
    case "GUEST":
      return (
        <div className="flex flex-col gap-3">
          <Button className={wide} nativeButton={false} render={<Link to={`/login?returnTo=${encodeURIComponent(`/auctions/${auction.id}`)}`} />}>
            {t("buyer.bidPanel.text24", "เข้าสู่ระบบเพื่อบิด")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("buyer.bidPanel.text25", "ยังไม่มีบัญชี?")}{" "}
            <Link to={`/register?returnTo=${encodeURIComponent(`/auctions/${auction.id}`)}`} className="font-semibold text-primary hover:underline">
              {t("buyer.bidPanel.text26", "สมัครสมาชิก")}
            </Link>{" "}
            {t("buyer.bidPanel.text27", "— ต้องยืนยันอีเมลและเพิ่มที่อยู่ก่อนบิด")}
          </p>
        </div>
      );
    case "NEEDS_ADDRESS":
      return (
        <div className="flex flex-col gap-3">
          <AuctionNotice
            tone="amber"
            icon={<Info />}
            title={t("buyer.bidPanel.title", "อีกขั้นเดียวก่อนบิด")}
            detail={t("buyer.bidPanel.detail", "เพิ่มที่อยู่จัดส่งอย่างน้อย 1 ที่ เพื่อให้ผู้ขายส่งของได้ทันทีถ้าคุณชนะ")}
          />
          <Button className={wide} nativeButton={false} render={<Link to="/account/addresses" />}>
            {t("buyer.bidPanel.text28", "เพิ่มที่อยู่จัดส่ง")}
          </Button>
        </div>
      );
    case "NEEDS_EMAIL":
      return <AuctionNotice tone="amber" icon={<Info />} title={EMAIL_NOT_VERIFIED_MESSAGE.title} detail={EMAIL_NOT_VERIFIED_MESSAGE.detail} />;
    case "OWN_AUCTION":
      return (
        <div className="flex flex-col gap-3">
          <AuctionNotice tone="sky" icon={<Lock />} title={t("buyer.bidPanel.title2", "นี่คือประมูลของร้านคุณ")} detail={t("buyer.bidPanel.detail2", "ผู้ขายบิดประมูลของตัวเองไม่ได้")} />
          <Button variant="outline" className={wide} nativeButton={false} render={<Link to={`/seller/auctions/${auction.id}`} />}>
            {t("buyer.bidPanel.text29", "จัดการประมูลนี้")}
          </Button>
        </div>
      );
    case "BANNED":
      return (
        <div className="flex flex-col gap-3">
          <AuctionNotice
            tone="red"
            icon={<Ban />}
            title={auction.viewer?.bannedUntil ? t("buyer.bidPanel.text30", "คุณถูกห้ามบิดถึง {bannedUntil}", { bannedUntil: formatAuctionDate(auction.viewer.bannedUntil) }) : t("buyer.bidPanel.text31", "คุณถูกห้ามบิด")}
            detail={t("buyer.bidPanel.detail3", "ไม่ชำระเงินหลังชนะครบ {strikeLimit} ครั้ง · ยังซื้อสินค้าปกติได้", { strikeLimit: auctionRules(auction).strikeLimit })}
          />
          <Button className={`${wide} bg-slate-100 text-muted-foreground`} disabled>
            {t("buyer.bidPanel.text21", "บิด")}
          </Button>
        </div>
      );
    case "CLOSING":
      return (
        <AuctionNotice
          tone="slate"
          icon={<Clock />}
          title={t("buyer.bidPanel.title3", "หมดเวลาประมูลแล้ว")}
          detail={t("buyer.bidPanel.detail4", "ระบบกำลังสรุปผู้ชนะ หน้านี้จะอัปเดตเองในไม่ช้า")}
        />
      );
    case "AWAITING_PAYMENT":
      return (
        <AuctionNotice
          tone="slate"
          icon={<Clock />}
          title={t("buyer.bidPanel.title4", "ประมูลนี้ปิดรับบิดแล้ว")}
          detail={t("buyer.bidPanel.detail5", "ถ้าผู้ชนะไม่ชำระใน {paymentHours} ประมูลจะถูกยกเลิก และการ์ดกลับเข้าสต็อกผู้ขาย", { paymentHours: formatPaymentWindow(auctionRules(auction).paymentHours) })}
        />
      );
    case "SOLD":
      return (
        <div className="flex flex-col gap-3">
          <Button variant="outline" className={wide} nativeButton={false} render={<Link to={`/products/${encodeURIComponent(auction.item.card.productSlug)}`} />}>
            {t("buyer.bidPanel.text32", "ดูการ์ดนี้ในตลาด")}
          </Button>
          <Button variant="outline" className={wide} nativeButton={false} render={<Link to="/auctions" />}>
            {t("buyer.bidPanel.text33", "ดูประมูลอื่นที่เปิดอยู่")}
          </Button>
        </div>
      );
    case "UNSOLD":
      return (
        <Button variant="outline" className={wide} nativeButton={false} render={<Link to={`/u/${encodeURIComponent(auction.seller.username)}`} />}>
          {t("buyer.bidPanel.text34", "ดูการ์ดนี้ในหน้าร้าน")}
        </Button>
      );
    case "SUSPENDED":
      return (
        <AuctionNotice
          tone="red"
          icon={<Ban />}
          title={t("buyer.bidPanel.title5", "ประมูลนี้ถูกระงับ")}
          detail={t("buyer.bidPanel.detail6", "{value}บิดทั้งหมดถูกยกเลิก ไม่มีผู้ชนะ", { value: auction.suspendReason ? `${t("buyer.bidPanel.suspendReason", "เหตุผล: {reason}", { reason: auction.suspendReason })} · ` : "" })}
        />
      );
    default:
      return null;
  }
}

/** B3-F ชนะแล้ว → ชำระเงินภายใน 24 ชม. ผ่าน checkout โหมดประมูล */
function WonPanel({ auction }: { auction: AuctionDetail }) {
  const { t } = useTranslate("auction");
  const total = auction.currentPrice + auction.shippingFee;
  const dueAt = auction.viewer?.paymentDueAt ?? null;
  return (
    <section aria-label={t("buyer.bidPanel.ariaLabel", "กล่องบิด")} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <AuctionStatusPill kind="Won" />
        {dueAt ? <AuctionCountdown target={dueAt} serverTime={auction.serverTime} prefix={t("buyer.bidPanel.prefix", "ชำระภายใน")} tone="urgent" /> : null}
      </div>
      <div className="flex items-start gap-3">
        <Trophy aria-hidden className="mt-0.5 size-6 shrink-0 text-emerald-700" />
        <div>
          <p className="text-lg font-bold">{t("buyer.bidPanel.text35", "คุณชนะประมูล!")}</p>
          <p className="text-sm text-muted-foreground">
            {auction.item.card.productName} {t("buyer.bidPanel.text36", "· ราคาปิด")}{" "}{formatBaht(auction.currentPrice)}
          </p>
        </div>
      </div>
      <PriceSummary
        rows={[
          [t("buyer.bidPanel.text37", "ราคาชนะ"), auction.currentPrice],
          [t("buyer.bidPanel.text38", "ค่าจัดส่ง"), auction.shippingFee],
        ]}
        totalLabel={t("buyer.bidPanel.totalLabel", "ยอดชำระ")}
        total={total}
      />
      <Button className="h-12 w-full rounded-full text-base font-bold" nativeButton={false} render={<Link to={`/checkout?auction=${auction.id}`} />}>
        {t("buyer.bidPanel.text39", "ชำระเงิน")}{" "}{formatBaht(total)}
      </Button>
      <p className="text-xs text-muted-foreground">
        {t("buyer.bidPanel.text40", "ใช้ขั้นตอนชำระเงินเดิม (โอน + แนบสลิป / PromptPay) · ไม่ชำระใน")}{" "}{formatPaymentWindow(auctionRules(auction).paymentHours)} {t("buyer.bidPanel.text41", "คำสั่งซื้อถูกยกเลิก และถูกบันทึกไม่ชำระ 1 ครั้ง")}
      </p>
    </section>
  );
}

// @tolgee-key {"key": "buyer.bidPanel.label", "ns": "auction", "defaultValue": "หมดเวลา · กำลังสรุปผล"}
// @tolgee-key {"key": "buyer.bidPanel.label2", "ns": "auction", "defaultValue": "จบแล้ว · รอชำระ"}
// @tolgee-key {"key": "buyer.bidPanel.label3", "ns": "auction", "defaultValue": "ขายแล้ว"}
// @tolgee-key {"key": "buyer.bidPanel.text3", "ns": "auction", "defaultValue": "ไม่มีผู้ชำระ"}
// @tolgee-key {"key": "buyer.bidPanel.text4", "ns": "auction", "defaultValue": "ไม่มีผู้บิด"}
