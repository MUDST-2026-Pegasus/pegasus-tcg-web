import type { ReactNode } from "react";
import { Ban, TriangleAlert } from "lucide-react";

import { formatAuctionDate, isBiddingBanned } from "../auction.format";

type StrikeBannerProps = {
  unpaidStrikes: number;
  strikeLimit: number;
  bannedUntil: string | null;
  /** ไม่มี = ไม่แสดงชื่อการ์ด */
  lastStrikeCardName?: string | null;
};

/**
 * แบนเนอร์โทษไม่ชำระ ตาม Figma B3-H [TCG-631 · FE-5]
 * - ถูกห้ามบิดอยู่ → "ถูกห้ามบิดถึง {วันที่}"
 * - เคยไม่ชำระแต่ยังไม่ครบ → "คุณไม่ชำระเงินภายในเวลา (n/3)"
 * - ไม่เคย → ไม่แสดง
 */
export function StrikeBanner({ unpaidStrikes, strikeLimit, bannedUntil, lastStrikeCardName }: StrikeBannerProps) {
  if (isBiddingBanned(bannedUntil)) {
    return (
      <Banner icon={<Ban aria-hidden className="size-5 shrink-0" />} title={`ถูกห้ามบิดถึง ${formatAuctionDate(bannedUntil!)}`}>
        ไม่ชำระเงินหลังชนะครบ {strikeLimit} ครั้ง · ยังซื้อสินค้าปกติได้
      </Banner>
    );
  }
  if (unpaidStrikes <= 0) return null;
  return (
    <Banner
      icon={<TriangleAlert aria-hidden className="size-5 shrink-0" />}
      title={`คุณไม่ชำระเงินภายในเวลา (${unpaidStrikes}/${strikeLimit})`}
    >
      {lastStrikeCardName ? `${lastStrikeCardName} · ` : ""}คำสั่งซื้อถูกยกเลิกแล้ว · ครบ {strikeLimit} ครั้งจะถูกห้ามบิด 30 วัน
    </Banner>
  );
}

function Banner({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-red-700">
      {icon}
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs">{children}</p>
      </div>
    </div>
  );
}
