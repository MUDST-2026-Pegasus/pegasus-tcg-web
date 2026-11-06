import { ArrowRight, Gavel } from "lucide-react";
import { Link } from "react-router-dom";

import { formatBaht, formatRemaining, summarizeAuctions } from "@/features/auction/auction.format";
import { useVariantAuctions } from "@/features/auction/auction.queries";
import { useCountdown } from "@/features/auction/useCountdown";

/**
 * กล่องใต้ปุ่มซื้อในหน้ารายละเอียดสินค้า เมื่อการ์ดรุ่นนี้มีประมูลเปิดอยู่ [TCG-636 · FE-10]
 * @param variantIds รุ่นที่เลือก หรือทุกรุ่นของสินค้าถ้าเลือก "All variants"
 */
export function ProductAuctionBox({ variantIds, productName }: { variantIds: number[]; productName: string }) {
  const { auctions, total, serverTime } = useVariantAuctions(variantIds);
  const summary = summarizeAuctions(auctions, total);
  if (!summary) return null;

  // ใบเดียว → ไปหน้าประมูลนั้นเลย · หลายใบ → หน้ารวมค้นด้วยชื่อการ์ด
  const href = summary.count === 1 ? `/auctions/${summary.soonest.id}` : `/auctions?q=${encodeURIComponent(productName)}`;

  return (
    <div role="status" className="flex items-center gap-3 rounded-xl bg-sky-50 px-4 py-3 text-sky-800">
      <Gavel aria-hidden className="size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-bold">มีประมูลการ์ดนี้อยู่ {summary.count} รายการ</p>
        <p className="text-xs">
          ราคาบิดต่ำสุดตอนนี้ {formatBaht(summary.lowest)} · ใกล้จบใน <Remaining target={summary.soonest.endsAt} serverTime={serverTime} />
        </p>
      </div>
      <Link to={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
        ดูประมูล
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}

function Remaining({ target, serverTime }: { target: string; serverTime?: string }) {
  const remaining = useCountdown(target, serverTime) ?? 0;
  return <span className="tabular-nums">{formatRemaining(remaining)}</span>;
}
