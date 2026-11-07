import { translate, useLanguage } from "@/lib/language";
import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBaht } from "@/features/auction/auction.format";
import { AuctionCountdown } from "@/features/auction/components/AuctionCountdown";
import { AuctionStatusPill } from "@/features/auction/components/AuctionStatusPill";
import type { SellerAuctionRow } from "@/features/auction/auction.types";
import { useCountdown } from "@/features/auction/useCountdown";
import { cn } from "@/lib/utils";

import { formatHoursMinutes, sellerAuctionRowView, type CellTone, type RowAction } from "../auctions-table.format";

const HEAD_CLASS = "h-auto py-2.5 text-xs font-medium text-muted-foreground";

const TONE: Record<CellTone, string> = {
  primary: "font-bold text-primary",
  bold: "font-bold text-foreground",
  amber: "font-semibold text-amber-800",
  muted: "text-muted-foreground",
};

type AuctionsTableProps = {
  rows: SellerAuctionRow[];
  /** `serverTime` ของหน้า ให้ตัวนับทุกแถวตรงกัน */
  serverTime?: string;
  onCancel: (row: SellerAuctionRow) => void;
  /** กำลังดึงหน้าใหม่ แถวที่เห็นเป็นของเดิม */
  isFetching: boolean;
  footer: ReactNode;
};

/** ตารางประมูลของร้าน (S1) — ค่าแต่ละคอลัมน์มาจาก `sellerAuctionRowView` [TCG-632 · FE-6] */
export function AuctionsTable({ rows, serverTime, onCancel, isFetching, footer }: AuctionsTableProps) {
  useLanguage();
  const navigate = useNavigate();
  return (
    <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-none">
      <Table className={cn(isFetching && "opacity-60")}>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={cn(HEAD_CLASS, "pl-4")}>{translate("การ์ด", "Cards")}</TableHead>
            <TableHead className={HEAD_CLASS}>{translate("ราคาเริ่มต้น", "Starting price")}</TableHead>
            <TableHead className={HEAD_CLASS}>{translate("ราคาปัจจุบัน", "Current price")}</TableHead>
            <TableHead className={HEAD_CLASS}>{translate("บิด", "Bids")}</TableHead>
            <TableHead className={HEAD_CLASS}>{translate("ซื้อทันที", "Buy now")}</TableHead>
            <TableHead className={HEAD_CLASS}>{translate("เวลา", "Time")}</TableHead>
            <TableHead className={HEAD_CLASS}>{translate("สถานะ", "Status")}</TableHead>
            <TableHead className={HEAD_CLASS}>
              <span className="sr-only">{translate("การกระทำ", "Action")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const view = sellerAuctionRowView(row);
            const { item } = row;
            return (
              <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/seller/auctions/${row.id}`)}>
                <TableCell className="py-3 pl-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-secondary">
                      {item.card.officialImageUrl ? (
                        <img src={item.card.officialImageUrl} alt="" className="size-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.card.productName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.condition} · {item.gameName}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">{formatBaht(row.startingPrice)}</TableCell>
                <TableCell className={cn("text-sm tabular-nums", TONE[view.currentPrice.tone])}>{view.currentPrice.text}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">{row.bidCount.toLocaleString("th-TH")}</TableCell>
                <TableCell className={cn("text-sm tabular-nums", TONE[view.buyNow.tone])}>{view.buyNow.text}</TableCell>
                <TableCell className="text-sm">
                  {view.time.kind === "countdown" ? (
                    <AuctionCountdown target={row.endsAt} serverTime={serverTime} prefix="" />
                  ) : view.time.kind === "payment" && row.deadline ? (
                    <PaymentDue deadline={row.deadline} serverTime={serverTime} />
                  ) : view.time.kind === "ended" ? (
                    <span className="text-muted-foreground">{view.time.text}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <AuctionStatusPill kind={view.pill.kind} label={view.pill.label} />
                </TableCell>
                <TableCell className="pr-4 text-right" onClick={(event) => event.stopPropagation()}>
                  <RowActionButton action={view.action} row={row} onCancel={onCancel} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {footer}
    </Card>
  );
}

/** "ชำระใน 18:22" เดินทุกวินาที */
function PaymentDue({ deadline, serverTime }: { deadline: string; serverTime?: string }) {
  useLanguage();
  const remaining = useCountdown(deadline, serverTime) ?? 0;
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
      <Clock aria-hidden className="size-3.5" />
      {translate("ชำระใน", "Pay within") + " "}{formatHoursMinutes(remaining)}
    </span>
  );
}

function RowActionButton({ action, row, onCancel }: { action: RowAction; row: SellerAuctionRow; onCancel: (row: SellerAuctionRow) => void }) {
  useLanguage();
  const link = "text-sm font-semibold text-primary hover:underline";
  switch (action) {
    case "VIEW":
      return (
        <Link to={`/seller/auctions/${row.id}`} className={link}>
          {translate("ดู", "View")}</Link>
      );
    case "CANCEL":
      return (
        <button type="button" className="cursor-pointer text-sm font-semibold text-destructive hover:underline" onClick={() => onCancel(row)}>
          {translate("ยกเลิก", "Cancel")}</button>
      );
    case "VIEW_ORDER":
      return (
        <Link to={row.orderId ? `/seller/orders/${row.orderId}` : "/seller/orders"} className={link}>
          ดูคำสั่งซื้อ
        </Link>
      );
    case "RELIST":
      // ฟอร์มเปิดประมูล (FE-7) อ่าน `?from=` ไปเติมข้อมูลเดิม
      return (
        <Link to={`/seller/auctions/new?from=${row.id}`} className={link}>
          {translate("ประมูลใหม่", "Relist auction")}</Link>
      );
  }
}
