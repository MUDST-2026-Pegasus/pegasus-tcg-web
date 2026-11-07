import { translate, useLanguage } from "@/lib/language";
import { Link } from "react-router-dom";

import { formatBaht } from "@/features/auction/auction.format";
import { useAdminAuctions } from "@/features/auction/auction.queries";

import { formatCount } from "../catalog.format";
import { StatCard } from "./StatCard";

/**
 * ภาพรวมแพลตฟอร์ม · ตัวเลขประมูล "กำลังประมูล" / "ยอดขายจากประมูล (30 วัน)" [TCG-636 · FE-10]
 * ระหว่างโหลดหรือโหลดไม่สำเร็จไม่แสดง — ตัวเลขเดิมของหน้ายังใช้ได้ตามปกติ
 */
export function AuctionOverviewCards() {
  useLanguage();
  const query = useAdminAuctions();
  if (!query.data) return null;
  const { kpis } = query.data;
  const link = "flex flex-1 rounded-xl outline-none transition-colors hover:[&>*]:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <Link to="/admin/auctions" className={link}>
        <StatCard
          id="auctions-live"
          label={translate("กำลังประมูล", "Live auction")}
          value={formatCount(kpis.live)}
          delta={null}
          footnote={`จบภายใน 1 ชม. ${formatCount(kpis.endingWithinHour)}`}
          bars={null}
          accent="primary"
        />
      </Link>
      <Link to="/admin/auctions" className={link}>
        <StatCard
          id="auctions-sold"
          label="ยอดขายจากประมูล (30 วัน)"
          value={formatBaht(kpis.soldLast30Days)}
          delta={null}
          footnote={`รอผู้ชนะชำระ ${formatCount(kpis.awaitingPayment)}`}
          bars={null}
          accent="green"
        />
      </Link>
    </div>
  );
}
