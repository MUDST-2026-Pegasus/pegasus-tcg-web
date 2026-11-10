import { CircleCheck, CircleX, Clock, Gavel, ShieldAlert, Undo2, UserX } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { formatBaht, formatRemaining } from "@/features/auction/auction.format";
import type { SellerAuctionDetail } from "@/features/auction/auction.types";
import { AuctionNotice } from "@/features/auction/components/AuctionNotice";
import { useCountdown } from "@/features/auction/useCountdown";

import { relistPath, sellerNoticeKind } from "../seller-auction-detail.format";
import { ReturnToListingButton } from "./ReturnToListingButton";
import { useTranslate } from "@/lib/i18n";

type SellerAuctionNoticesProps = {
  detail: SellerAuctionDetail;
  /** มีบิดเพิ่มระหว่างเปิดหน้านี้ */
  newBid: boolean;
};

/** แบนเนอร์แจ้งเตือนฝั่งผู้ขาย ตาม Figma S3-C [TCG-634 · FE-8] */
export function SellerAuctionNotices({ detail, newBid }: SellerAuctionNoticesProps) {
  const { t } = useTranslate("auction");
  const kind = sellerNoticeKind(detail, newBid);
  const name = detail.item.card.productName;

  // แอดมินระงับ — บอกเหตุผลให้ผู้ขายเห็นเหมือนที่ผู้บิดเห็น [TCG-640]
  if (detail.status === "SUSPENDED") {
    return (
      <AuctionNotice
        tone="red"
        icon={<ShieldAlert />}
        title={t("seller.sellerAuctionNotices.title", "แอดมินระงับประมูลนี้ — การ์ดกลับเข้าสต็อกแล้ว")}
        detail={detail.suspendReason ? t("seller.sellerAuctionNotices.text", "เหตุผล: {suspendReason}", { suspendReason: detail.suspendReason }) : name}
      />
    );
  }

  switch (kind) {
    case "NEW_BID":
      return (
        <AuctionNotice
          tone="sky"
          icon={<Gavel />}
          title={t("seller.sellerAuctionNotices.title2", "มีบิดใหม่ {currentPrice}", { currentPrice: formatBaht(detail.currentPrice) })}
          detail={
            <>
              {name} · {detail.bidCount} {t("seller.sellerAuctionNotices.text2", "บิด · เหลือ")}{" "}<Remaining target={detail.endsAt} serverTime={detail.serverTime} />
            </>
          }
        />
      );
    case "BUY_NOW_SOLD":
      return (
        <AuctionNotice
          tone="emerald"
          icon={<CircleCheck />}
          title={t("seller.sellerAuctionNotices.title3", "ขายด้วยซื้อทันที {currentPrice}", { currentPrice: formatBaht(detail.currentPrice) })}
          detail={t("seller.sellerAuctionNotices.detail", "{name} · ประมูลจบแล้ว รอผู้ซื้อชำระเงินก่อนจัดส่ง", { name })}
        />
      );
    case "AWAITING_PAYMENT":
      return (
        <AuctionNotice
          tone="amber"
          icon={<Clock />}
          title={t("seller.sellerAuctionNotices.title4", "ประมูลจบ — รอผู้ชนะชำระเงิน")}
          detail={
            <>
              {name} · {formatBaht(detail.currentPrice)}
              {detail.paymentDueAt ? (
                <>
                  {" "}
                  {t("seller.sellerAuctionNotices.text3", "· ครบกำหนดใน")}{" "}<Remaining target={detail.paymentDueAt} serverTime={detail.serverTime} />
                </>
              ) : null}
            </>
          }
        />
      );
    case "WINNER_UNPAID":
      return (
        <AuctionNotice
          tone="amber"
          icon={<UserX />}
          title={t("seller.sellerAuctionNotices.title5", "ผู้ชนะไม่ชำระ — การ์ดกลับเข้าสต็อกแล้ว")}
          detail={t("seller.sellerAuctionNotices.detail2", "{name} · คำสั่งซื้อถูกยกเลิก · ผู้ชนะถูกบันทึกไม่ชำระ 1 ครั้ง", { name })}
          action={<BackInStockActions detail={detail} relistVariant="default" />}
        />
      );
    case "NO_BIDS":
      return (
        <AuctionNotice
          tone="slate"
          icon={<Undo2 />}
          title={t("seller.sellerAuctionNotices.title6", "ไม่มีผู้บิด — การ์ดกลับเข้าสต็อกแล้ว")}
          detail={name}
          action={<BackInStockActions detail={detail} relistVariant="outline" />}
        />
      );
    case "CANCELLED":
      return (
        <AuctionNotice
          tone="slate"
          icon={<CircleX />}
          title={t("seller.sellerAuctionNotices.title7", "ยกเลิกประมูลแล้ว — การ์ดกลับเข้าสต็อกแล้ว")}
          detail={name}
          action={<BackInStockActions detail={detail} relistVariant="outline" />}
        />
      );
    default:
      return null;
  }
}

function Remaining({ target, serverTime }: { target: string; serverTime: string }) {
  const remaining = useCountdown(target, serverTime) ?? 0;
  return <span className="tabular-nums">{formatRemaining(remaining)}</span>;
}

/** การ์ดกลับเข้ามือแล้ว: เอากลับไปลงขาย หรือเปิดประมูลใหม่ */
function BackInStockActions({ detail, relistVariant }: { detail: SellerAuctionDetail; relistVariant: "default" | "outline" }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ReturnToListingButton detail={detail} />
      <RelistButton auctionId={detail.id} variant={relistVariant} />
    </div>
  );
}

function RelistButton({ auctionId, variant }: { auctionId: number; variant: "default" | "outline" }) {
  const { t } = useTranslate("auction");
  return (
    <Button
      variant={variant}
      size="sm"
      className="rounded-full px-4"
      nativeButton={false}
      render={<Link to={relistPath(auctionId)} />}
    >
      {t("seller.sellerAuctionNotices.text4", "ประมูลใหม่")}
    </Button>
  );
}
