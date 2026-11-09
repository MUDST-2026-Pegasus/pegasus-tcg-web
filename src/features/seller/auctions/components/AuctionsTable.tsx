import { DataTable, type DataTableColumn } from "@/components/common";
import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { formatBaht } from "@/features/auction/auction.format";
import { AuctionCountdown } from "@/features/auction/components/AuctionCountdown";
import { AuctionStatusPill } from "@/features/auction/components/AuctionStatusPill";
import type { SellerAuctionRow } from "@/features/auction/auction.types";
import { useCountdown } from "@/features/auction/useCountdown";
import { cn } from "@/lib/utils";

import { formatHoursMinutes, sellerAuctionRowView, type CellTone, type RowAction } from "../auctions-table.format";
import { intlLocale } from "@/lib/i18n";

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
  const navigate = useNavigate();
  const columns: DataTableColumn<SellerAuctionRow>[] = [
    {
      id: "card",
      header: "การ์ด",
      meta: { headClassName: cn(HEAD_CLASS, "pl-4"), cellClassName: "py-3 pl-4" },
      cell: ({ row: { original: { item } } }) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-secondary">
            {item.card.officialImageUrl ? <img src={item.card.officialImageUrl} alt="" className="size-full object-cover" loading="lazy" /> : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{item.card.productName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.condition} · {item.gameName}
            </p>
          </div>
        </div>
      ),
    },
    { id: "start", header: "ราคาเริ่มต้น", meta: { headClassName: HEAD_CLASS, cellClassName: "text-sm font-semibold tabular-nums" }, cell: ({ row }) => formatBaht(row.original.startingPrice) },
    {
      id: "current",
      header: "ราคาปัจจุบัน",
      meta: { headClassName: HEAD_CLASS, cellClassName: "text-sm tabular-nums" },
      cell: ({ row }) => {
        const { currentPrice } = sellerAuctionRowView(row.original);
        return <span className={TONE[currentPrice.tone]}>{currentPrice.text}</span>;
      },
    },
    { id: "bids", header: "บิด", meta: { headClassName: HEAD_CLASS, cellClassName: "text-sm font-semibold tabular-nums" }, cell: ({ row }) => row.original.bidCount.toLocaleString(intlLocale()) },
    {
      id: "buyNow",
      header: "ซื้อทันที",
      meta: { headClassName: HEAD_CLASS, cellClassName: "text-sm tabular-nums" },
      cell: ({ row }) => {
        const { buyNow } = sellerAuctionRowView(row.original);
        return <span className={TONE[buyNow.tone]}>{buyNow.text}</span>;
      },
    },
    {
      id: "time",
      header: "เวลา",
      meta: { headClassName: HEAD_CLASS, cellClassName: "text-sm" },
      cell: ({ row: { original: row } }) => {
        const { time } = sellerAuctionRowView(row);
        if (time.kind === "countdown") return <AuctionCountdown target={row.endsAt} serverTime={serverTime} prefix="" />;
        if (time.kind === "payment" && row.deadline) return <PaymentDue deadline={row.deadline} serverTime={serverTime} />;
        return <span className="text-muted-foreground">{time.kind === "ended" ? time.text : "—"}</span>;
      },
    },
    {
      id: "status",
      header: "สถานะ",
      meta: { headClassName: HEAD_CLASS },
      cell: ({ row }) => {
        const { pill } = sellerAuctionRowView(row.original);
        return <AuctionStatusPill kind={pill.kind} label={pill.label} />;
      },
    },
    {
      id: "action",
      header: () => <span className="sr-only">การกระทำ</span>,
      meta: { headClassName: HEAD_CLASS, cellClassName: "pr-4 text-right" },
      cell: ({ row }) => (
        // กดปุ่มในแถวแล้วไม่ให้เปิดหน้ารายละเอียดซ้อน
        <span onClick={(event) => event.stopPropagation()}>
          <RowActionButton action={sellerAuctionRowView(row.original).action} row={row.original} onCancel={onCancel} />
        </span>
      ),
    },
  ];

  return (
    <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-none">
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => String(row.id)}
        tableClassName={cn(isFetching && "opacity-60")}
        headerRowClassName="bg-muted/40 hover:bg-muted/40"
        onRowClick={(row) => navigate(`/seller/auctions/${row.id}`)}
      />
      {footer}
    </Card>
  );
}

/** "ชำระใน 18:22" เดินทุกวินาที */
function PaymentDue({ deadline, serverTime }: { deadline: string; serverTime?: string }) {
  const remaining = useCountdown(deadline, serverTime) ?? 0;
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
      <Clock aria-hidden className="size-3.5" />
      ชำระใน {formatHoursMinutes(remaining)}
    </span>
  );
}

function RowActionButton({ action, row, onCancel }: { action: RowAction; row: SellerAuctionRow; onCancel: (row: SellerAuctionRow) => void }) {
  const link = "text-sm font-semibold text-primary hover:underline";
  switch (action) {
    case "VIEW":
      return (
        <Link to={`/seller/auctions/${row.id}`} className={link}>
          ดู
        </Link>
      );
    case "CANCEL":
      return (
        <button type="button" className="cursor-pointer text-sm font-semibold text-destructive hover:underline" onClick={() => onCancel(row)}>
          ยกเลิก
        </button>
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
          ประมูลใหม่
        </Link>
      );
  }
}
