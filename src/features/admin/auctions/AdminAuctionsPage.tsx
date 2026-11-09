import { useState, type ReactNode } from "react";

import { Flag, Gavel } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary, DataTable, type DataTableColumn } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AUCTION_STATUS_LABEL, formatBaht, formatRemaining, pillForStatus } from "@/features/auction/auction.format";
import { useAdminAuctions, useBannedBidders } from "@/features/auction/auction.queries";
import type { AdminAuctionPage, AdminAuctionRow, AdminAuctionTab } from "@/features/auction/auction.types";
import { AuctionCountdown } from "@/features/auction/components/AuctionCountdown";
import { AuctionStatusPill } from "@/features/auction/components/AuctionStatusPill";
import { useCountdown } from "@/features/auction/useCountdown";
import { ProductPagination } from "@/features/seller/products/components/ProductPagination";
import { ProductTableSkeleton } from "@/features/seller/products/components/ProductTableSkeleton";
import { downloadCsv } from "@/lib/csv";

import {
  ADMIN_AUCTION_TABS,
  adminTimeCell,
  auctionFlags,
  canSuspend,
  readAdminAuctionTab,
} from "./admin-auctions.format";
import { AdminKpi, AdminSearchBox, AdminTabs } from "./components/AdminAuctionShared";
import { RiskFlag } from "./components/RiskFlag";
import { SuspendAuctionDialog, type SuspendTarget } from "./components/SuspendAuctionDialog";
import { intlLocale } from "@/lib/i18n";

const PAGE_SIZE = 20;

/** `/admin/auctions` — A1 การประมูลทั้งหมด ตาม Figma 2299:8127 [TCG-635 · FE-9] */
/**
 * ข้อความป้ายที่ต่างจากค่าเริ่มต้นของ kind — ยกเลิกใช้ป้ายสีเดียวกับไม่มีผู้บิด แต่ต้องบอกว่ายกเลิก
 * และ UNSOLD ที่มีบิดคือผู้ชนะไม่ชำระ [TCG-640]
 */
function adminStatusLabel(row: AdminAuctionRow): string | undefined {
  if (row.status === "SOLD") return "ขายแล้ว";
  if (row.status === "CANCELLED") return AUCTION_STATUS_LABEL.CANCELLED;
  if (row.status === "UNSOLD" && row.bidCount > 0) return "ไม่มีผู้ชำระ";
  return undefined;
}

export function AdminAuctionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = readAdminAuctionTab(searchParams.get("tab"));
  const search = searchParams.get("q") ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const auctions = useAdminAuctions({ tab, q: search || undefined, page: page - 1, size: PAGE_SIZE });
  const banned = useBannedBidders({ tab: "BANNED" });
  const [suspendTarget, setSuspendTarget] = useState<SuspendTarget | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);

  function updateParams(changes: { tab?: AdminAuctionTab; q?: string; page?: number }) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (changes.tab !== undefined) {
          if (changes.tab === "ALL") next.delete("tab");
          else next.set("tab", changes.tab);
          next.delete("page");
        }
        if (changes.q !== undefined) {
          if (changes.q.trim()) next.set("q", changes.q.trim());
          else next.delete("q");
          next.delete("page");
        }
        if (changes.page !== undefined) {
          if (changes.page <= 1) next.delete("page");
          else next.set("page", String(changes.page));
        }
        return next;
      },
      { replace: true },
    );
  }

  const data = auctions.data;
  const bannedCount = banned.data?.tabCounts.BANNED;

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`auctions-${tab.toLowerCase()}.csv`, [
      ["รหัสประมูล", "การ์ด", "ผู้ขาย", "ราคาปัจจุบัน", "บิด", "ผู้บิด", "สถานะ", "ปิด"],
      ...data.page.items.map((row) => [row.auctionNumber, row.cardName, row.shopName, row.currentPrice, row.bidCount, row.bidderCount, row.status, row.endsAt]),
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">การประมูลทั้งหมด</h1>
          <p className="text-[13px] text-muted-foreground">ดูประมูลทั้งแพลตฟอร์ม ระงับประมูลที่ผิดกฎ และจัดการผู้ใช้ที่ติดโทษห้ามบิด</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-md px-2.5" disabled={!data} onClick={exportCsv}>
            ส่งออก CSV
          </Button>
          <Button className="rounded-md px-2.5" nativeButton={false} render={<Link to="/admin/auctions/banned-bidders" />}>
            ผู้ใช้ที่ห้ามบิด{bannedCount !== undefined ? ` (${bannedCount.toLocaleString(intlLocale())})` : ""}
          </Button>
        </div>
      </div>

      {data && data.reportedCount + data.suspiciousCount > 0 ? <FlaggedBanner data={data} /> : null}

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminKpi label="กำลังประมูล" value={data.kpis.live} />
          <AdminKpi label="จบภายใน 1 ชม." value={data.kpis.endingWithinHour} valueClass="text-red-700" />
          <AdminKpi label="รอผู้ชนะชำระ" value={data.kpis.awaitingPayment} valueClass="text-amber-800" />
          <AdminKpi label="ถูกระงับ (30 วัน)" value={data.kpis.suspendedLast30Days} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTabs label="สถานะการประมูล" tabs={ADMIN_AUCTION_TABS} active={tab} counts={data?.tabCounts} onChange={(next) => updateParams({ tab: next })} />
        <AdminSearchBox value={search} placeholder="ค้นหาการ์ด ผู้ขาย หรือรหัสประมูล…" onChange={(q) => updateParams({ q })} />
      </div>

      <QueryBoundary
        query={auctions}
        loading={<ProductTableSkeleton />}
        errorTitle="โหลดรายการประมูลไม่สำเร็จ"
        isEmpty={(result) => result.page.items.length === 0}
        empty={<EmptyState icon={Gavel} title="ไม่พบการประมูล" description="ลองเปลี่ยนแท็บหรือคำค้นหา" />}
      >
        {(result) => (
          <AdminAuctionsTable
            data={result}
            disabled={auctions.isPlaceholderData}
            onSuspend={(row) => {
              setSuspendTarget({ id: row.id, cardName: row.cardName, auctionNumber: row.auctionNumber, bidCount: row.bidCount });
              setSuspendOpen(true);
            }}
            footer={
              <ProductPagination
                page={page}
                totalPages={result.page.totalPages}
                totalItems={result.page.totalItems}
                pageSize={PAGE_SIZE}
                rowsOnPage={result.page.items.length}
                disabled={auctions.isPlaceholderData}
                onPageChange={(next) => updateParams({ page: next })}
              />
            }
          />
        )}
      </QueryBoundary>

      <SuspendAuctionDialog key={suspendTarget?.id ?? 0} target={suspendTarget} open={suspendOpen} onOpenChange={setSuspendOpen} />
    </div>
  );
}

function FlaggedBanner({ data }: { data: AdminAuctionPage }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      <Flag aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold">
          มี {data.reportedCount} ประมูลที่ถูกรายงาน และ {data.suspiciousCount} ประมูลที่มีรูปแบบบิดผิดปกติ
        </p>
        <p className="text-xs">เช่น บัญชีใหม่บิดถี่ในประมูลเดียว หรือผู้บิดใช้ที่อยู่เดียวกับผู้ขาย — ตรวจสอบก่อนประมูลจบ</p>
      </div>
    </div>
  );
}

type AdminAuctionsTableProps = {
  data: AdminAuctionPage;
  disabled: boolean;
  onSuspend: (row: AdminAuctionRow) => void;
  footer: ReactNode;
};

function AdminAuctionsTable({ data, disabled, onSuspend, footer }: AdminAuctionsTableProps) {
  const navigate = useNavigate();
  const head = "text-xs font-normal text-muted-foreground";
  const link = "cursor-pointer text-xs font-semibold hover:underline";

  const columns: DataTableColumn<AdminAuctionRow>[] = [
    {
      id: "card",
      header: "การ์ด / รหัส",
      meta: { headClassName: `pl-4 ${head}`, cellClassName: "py-3 pl-4" },
      cell: ({ row: { original: row } }) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-secondary">
            {row.cardImageUrl ? <img src={row.cardImageUrl} alt="" className="size-full object-cover" loading="lazy" /> : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{row.cardName}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">#{row.auctionNumber}</span>
              {auctionFlags(row.signals, row.reportCount).map((flag) => (
                <RiskFlag key={flag} label={flag} />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    { id: "shop", header: "ผู้ขาย", meta: { headClassName: head, cellClassName: "text-xs text-muted-foreground" }, cell: ({ row }) => row.original.shopName },
    { id: "price", header: "ราคาปัจจุบัน", meta: { headClassName: head, cellClassName: "text-sm font-semibold tabular-nums text-foreground" }, cell: ({ row }) => formatBaht(row.original.currentPrice) },
    { id: "bids", header: "บิด / ผู้บิด", meta: { headClassName: head, cellClassName: "text-xs tabular-nums text-muted-foreground" }, cell: ({ row }) => `${row.original.bidCount} / ${row.original.bidderCount}` },
    { id: "time", header: "เวลา", meta: { headClassName: head }, cell: ({ row }) => <TimeCell row={row.original} serverTime={data.serverTime} /> },
    { id: "status", header: "สถานะ", meta: { headClassName: head }, cell: ({ row }) => <AuctionStatusPill kind={pillForStatus(row.original.status)} label={adminStatusLabel(row.original)} /> },
    {
      id: "actions",
      header: () => <span className="sr-only">การกระทำ</span>,
      meta: { headClassName: "pr-4", cellClassName: "pr-4 text-right" },
      cell: ({ row: { original: row } }) => (
        <div className="flex items-center justify-end gap-3" onClick={(event) => event.stopPropagation()}>
          <Link to={`/admin/auctions/${row.id}`} className={`${link} text-primary`}>
            {row.status === "SUSPENDED" ? "ดูเหตุผล" : "ดู"}
          </Link>
          {canSuspend(row.status) ? (
            <button type="button" className={`${link} text-destructive`} onClick={() => onSuspend(row)}>
              ระงับ
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-0 shadow-none" aria-busy={disabled || undefined}>
      <DataTable
        columns={columns}
        data={data.page.items}
        getRowId={(row) => String(row.id)}
        headerRowClassName="bg-muted/40 hover:bg-muted/40"
        onRowClick={(row) => navigate(`/admin/auctions/${row.id}`)}
      />
      {footer}
    </Card>
  );
}

function TimeCell({ row, serverTime }: { row: AdminAuctionRow; serverTime: string }) {
  const cell = adminTimeCell(row);
  if (cell.kind === "countdown") return <AuctionCountdown target={row.endsAt} serverTime={serverTime} prefix="" />;
  if (cell.kind === "payment" && row.deadline) return <PaymentDue deadline={row.deadline} serverTime={serverTime} />;
  return <span className="text-xs text-muted-foreground">{cell.kind === "text" ? cell.text : ""}</span>;
}

function PaymentDue({ deadline, serverTime }: { deadline: string; serverTime: string }) {
  const remaining = useCountdown(deadline, serverTime) ?? 0;
  return <span className="text-xs text-muted-foreground tabular-nums">ชำระใน {formatRemaining(remaining)}</span>;
}
