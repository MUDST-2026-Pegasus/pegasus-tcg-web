import { useLanguage } from "@/lib/language";
import { AuctionCard } from "@/features/auction/components/AuctionCard";
import type { AuctionSummary, EligibleUnit } from "@/features/auction/auction.types";
import { toNumber } from "@/features/seller/products/products.format";

import { closeAtMs } from "../auction-form.schema";
import type { AuctionFormValues } from "../auction-form.types";

const SHOP_LABEL = "ร้านของคุณ";
/** ยังไม่ได้ตั้งเวลาปิด — ตัวนับในตัวอย่างโชว์ระยะกลาง ๆ ไว้ก่อน */
const PLACEHOLDER_DURATION_MS = 3 * 24 * 60 * 60_000;

type AuctionPreviewCardProps = {
  unit: EligibleUnit | null;
  values: AuctionFormValues;
  now: number;
};

/** "ตัวอย่างที่ผู้ซื้อจะเห็น" — การ์ดประมูลใบเดียวกับหน้ารวม อัปเดตตามที่กรอก [TCG-633 · FE-7] */
export function AuctionPreviewCard({ unit, values, now }: AuctionPreviewCardProps) {
  useLanguage();
  if (!unit) {
    return (
      <div className="flex aspect-[3/4] w-56 items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center text-xs text-muted-foreground">
        เลือกการ์ดจากสต็อกเพื่อดูตัวอย่าง
      </div>
    );
  }
  const start = toNumber(values.startingPrice) ?? 0;
  const closeAt = closeAtMs(values.closeDate, values.closeTime) ?? now + PLACEHOLDER_DURATION_MS;
  const summary: AuctionSummary = {
    id: 0,
    auctionNumber: "",
    item: unit.item,
    shopName: SHOP_LABEL,
    startingPrice: start,
    currentPrice: start,
    bidCount: 0,
    buyNowPrice: values.buyNowEnabled ? toNumber(values.buyNowPrice) : null,
    endsAt: new Date(closeAt).toISOString(),
  };
  return <AuctionCard auction={summary} preview className="w-56" />;
}
