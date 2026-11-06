import { Link } from "react-router-dom";

import { auctionOrderLabel } from "../auction.format";
import type { OrderAuctionSource } from "../auction.types";
import { AuctionStatusPill } from "./AuctionStatusPill";

type AuctionSourcePillProps = {
  /** ช่อง `source` / `auctionId` / `auctionNumber` ของคำสั่งซื้อ */
  order: OrderAuctionSource;
  /** หน้าประมูลของแต่ละฝั่ง เช่น `/seller/auctions` — ค่าเริ่มต้นหน้าประมูลสาธารณะ */
  basePath?: string;
  /** `false` = ไม่เป็นลิงก์ (อยู่ในปุ่มอยู่แล้ว เช่นการ์ดในบอร์ดแอดมิน) */
  link?: boolean;
  className?: string;
};

/**
 * ป้าย "จากการประมูล #AUC-…" ในคำสั่งซื้อ (ผู้ซื้อ / ผู้ขาย / แอดมิน) กดแล้วไปหน้าประมูลนั้น [TCG-636 · FE-10]
 * แสดงเฉพาะ `source = AUCTION`
 */
export function AuctionSourcePill({ order, basePath = "/auctions", link = true, className }: AuctionSourcePillProps) {
  if (order.source !== "AUCTION" || !order.auctionNumber) return null;
  const pill = <AuctionStatusPill kind="Won" label={auctionOrderLabel(order.auctionNumber)} className={className} />;
  if (!link || !order.auctionId) return pill;
  return (
    <Link
      to={`${basePath}/${order.auctionId}`}
      onClick={(event) => event.stopPropagation()}
      className="relative z-10 rounded-full outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {pill}
    </Link>
  );
}
