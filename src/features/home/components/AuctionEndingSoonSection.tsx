import { translate, useLanguage } from "@/lib/language";
import { ArrowRight, Gavel } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuctions } from "@/features/auction/auction.queries";
import { AuctionCard } from "@/features/auction/components/AuctionCard";

/** จำนวนการ์ดในแถว Home */
export const HOME_AUCTION_COUNT = 4;

/**
 * Home · "ประมูลใกล้จบ" ต่อจาก Trending [TCG-636 · FE-10]
 * ไม่มีประมูลเปิด / โหลดไม่สำเร็จ → ไม่แสดงทั้ง section (หน้าแรกไม่ควรมีกล่อง error ของส่วนเสริม)
 */
export function AuctionEndingSoonSection() {
  useLanguage();
  const query = useAuctions({ sort: "ENDING_SOON", size: HOME_AUCTION_COUNT });
  const auctions = query.data?.page.items ?? [];
  if (!query.data || auctions.length === 0) return null;

  return (
    <section aria-label={translate("ประมูลใกล้จบ", "Auctions ending soon")} className="bg-secondary px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1216px] flex-col gap-[18px]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
              <Gavel aria-hidden className="size-3.5" />{translate("ประมูล", "AUCTION")}</span>
            <h2 className="text-[28px] leading-8 font-semibold text-foreground">{translate("ประมูลใกล้จบ", "Auctions ending soon")}</h2>
            <p className="text-xs text-muted-foreground">{translate("บิดก่อนหมดเวลา — มีคนบิดช่วงท้าย เวลาจะต่อให้อีก 2 นาที", "Bid before time runs out — a late bid adds another 2 minutes")}</p>
          </div>
          <Button
            variant="link"
            size="sm"
            className="h-7 shrink-0 cursor-pointer px-0 text-sm font-normal"
            nativeButton={false}
            render={<Link to="/auctions" />}
          >{translate("ดูประมูลทั้งหมด", "View all auctions")}<ArrowRight aria-hidden className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {auctions.slice(0, HOME_AUCTION_COUNT).map((auction) => (
            <AuctionCard key={auction.id} auction={auction} serverTime={query.data.serverTime} />
          ))}
        </div>
      </div>
    </section>
  );
}
