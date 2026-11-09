import { clockOffset } from "@/features/auction/auction.format";
import { useSellerAuctions } from "@/features/auction/auction.queries";
import { hoursUntil } from "@/features/seller/auctions/auctions-table.format";

import { StatCard } from "./StatCard";
import { intlLocale } from "@/lib/i18n";

/**
 * การ์ดตัวเลข "กำลังประมูล" / "รอผู้ชนะชำระ" ในแดชบอร์ดผู้ขาย กดแล้วไป `/seller/auctions` [TCG-636 · FE-10]
 * ระหว่างโหลดหรือโหลดไม่สำเร็จไม่แสดง — แดชบอร์ดเดิมยังใช้ได้ตามปกติ
 */
export function AuctionStatCards() {
  const query = useSellerAuctions();
  if (!query.data) return null;
  const { kpis, serverTime } = query.data;
  const offset = clockOffset(serverTime);

  return (
    <>
      <StatCard
        id="auctionsLive"
        accent="primary"
        label="กำลังประมูล"
        value={kpis.liveCount.toLocaleString(intlLocale())}
        footnote={`มีบิดแล้ว ${kpis.liveWithBids} รายการ`}
        to="/seller/auctions"
      />
      <StatCard
        id="auctionsAwaiting"
        accent="amber"
        label="รอผู้ชนะชำระ"
        value={kpis.awaitingPaymentCount.toLocaleString(intlLocale())}
        footnote={kpis.nextPaymentDueAt ? `ครบกำหนดใน ${hoursUntil(kpis.nextPaymentDueAt, offset)} ชม.` : "—"}
        to="/seller/auctions"
      />
    </>
  );
}
