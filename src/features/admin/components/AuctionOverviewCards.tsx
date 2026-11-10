import { Link } from "react-router-dom";

import { formatBaht } from "@/features/auction/auction.format";
import { useAdminAuctions } from "@/features/auction/auction.queries";

import { formatCount } from "../catalog.format";
import { StatCard } from "./StatCard";
import { useTranslate } from "@/lib/i18n";

/**
 * ภาพรวมแพลตฟอร์ม · ตัวเลขประมูล "กำลังประมูล" / "ยอดขายจากประมูล (30 วัน)" [TCG-636 · FE-10]
 * ระหว่างโหลดหรือโหลดไม่สำเร็จไม่แสดง — ตัวเลขเดิมของหน้ายังใช้ได้ตามปกติ
 */
export function AuctionOverviewCards() {
  const { t } = useTranslate("auction");
  const query = useAdminAuctions();
  if (!query.data) return null;
  const { kpis } = query.data;
  const link = "flex flex-1 rounded-xl outline-none transition-colors hover:[&>*]:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <Link to="/admin/auctions" className={link}>
        <StatCard
          id="auctions-live"
          label={t("admin.auctionOverviewCards.label", "กำลังประมูล")}
          value={formatCount(kpis.live)}
          delta={null}
          footnote={t("admin.auctionOverviewCards.footnote", "จบภายใน 1 ชม. {endingWithinHour}", { endingWithinHour: formatCount(kpis.endingWithinHour) })}
          bars={null}
          accent="primary"
        />
      </Link>
      <Link to="/admin/auctions" className={link}>
        <StatCard
          id="auctions-sold"
          label={t("admin.auctionOverviewCards.label2", "ยอดขายจากประมูล (30 วัน)")}
          value={formatBaht(kpis.soldLast30Days)}
          delta={null}
          footnote={t("admin.auctionOverviewCards.footnote2", "รอผู้ชนะชำระ {awaitingPayment}", { awaitingPayment: formatCount(kpis.awaitingPayment) })}
          bars={null}
          accent="green"
        />
      </Link>
    </div>
  );
}
