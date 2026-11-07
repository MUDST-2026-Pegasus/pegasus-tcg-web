import { translate, useLanguage } from "@/lib/language";
import { useState, type ReactNode } from "react";

import { Flag, Gavel } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBaht, formatRemaining, pillForStatus } from "@/features/auction/auction.format";
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

const PAGE_SIZE = 20;

/** `/admin/auctions` — A1 การประมูลทั้งหมด ตาม Figma 2299:8127 [TCG-635 · FE-9] */
export function AdminAuctionsPage() {
  useLanguage();
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
      ["รหัสประมูล", translate("การ์ด", "Cards"), translate("ผู้ขาย", "Seller"), translate("ราคาปัจจุบัน", "Current price"), translate("บิด", "Bids"), translate("ผู้บิด", "Bidder"), translate("สถานะ", "Status"), translate("ปิด", "Close")],
      ...data.page.items.map((row) => [row.auctionNumber, row.cardName, row.shopName, row.currentPrice, row.bidCount, row.bidderCount, row.status, row.endsAt]),
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">{translate("การประมูลทั้งหมด", "All auctions")}</h1>
          <p className="text-[13px] text-muted-foreground">ดูประมูลทั้งแพลตฟอร์ม ระงับประมูลที่ผิดกฎ และจัดการผู้ใช้ที่ติดโทษห้ามบิด</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-md px-2.5" disabled={!data} onClick={exportCsv}>
            {translate("ส่งออก CSV", "Export CSV")}</Button>
          <Button className="rounded-md px-2.5" nativeButton={false} render={<Link to="/admin/auctions/banned-bidders" />}>
            ผู้ใช้ที่ห้ามบิด{bannedCount !== undefined ? ` (${bannedCount.toLocaleString("th-TH")})` : ""}
          </Button>
        </div>
      </div>

      {data && data.reportedCount + data.suspiciousCount > 0 ? <FlaggedBanner data={data} /> : null}

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminKpi label={translate("กำลังประมูล", "Live auction")} value={data.kpis.live} />
          <AdminKpi label="จบภายใน 1 ชม." value={data.kpis.endingWithinHour} valueClass="text-red-700" />
          <AdminKpi label={translate("รอผู้ชนะชำระ", "Awaiting winner's payment")} value={data.kpis.awaitingPayment} valueClass="text-amber-800" />
          <AdminKpi label="ถูกระงับ (30 วัน)" value={data.kpis.suspendedLast30Days} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTabs label={translate("สถานะการประมูล", "Auction status")} tabs={ADMIN_AUCTION_TABS} active={tab} counts={data?.tabCounts} onChange={(next) => updateParams({ tab: next })} />
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
  useLanguage();
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
  useLanguage();
  const navigate = useNavigate();
  const head = "text-xs font-normal text-muted-foreground";
  const link = "cursor-pointer text-xs font-semibold hover:underline";

  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-0 shadow-none" aria-busy={disabled || undefined}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={`pl-4 ${head}`}>การ์ด / รหัส</TableHead>
            <TableHead className={head}>{translate("ผู้ขาย", "Seller")}</TableHead>
            <TableHead className={head}>{translate("ราคาปัจจุบัน", "Current price")}</TableHead>
            <TableHead className={head}>บิด / ผู้บิด</TableHead>
            <TableHead className={head}>{translate("เวลา", "Time")}</TableHead>
            <TableHead className={head}>{translate("สถานะ", "Status")}</TableHead>
            <TableHead className="pr-4">
              <span className="sr-only">{translate("การกระทำ", "Action")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.page.items.map((row) => {
            const suspended = row.status === "SUSPENDED";
            return (
              <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/admin/auctions/${row.id}`)}>
                <TableCell className="py-3 pl-4">
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
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.shopName}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums text-foreground">{formatBaht(row.currentPrice)}</TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">
                  {row.bidCount} / {row.bidderCount}
                </TableCell>
                <TableCell>
                  <TimeCell row={row} serverTime={data.serverTime} />
                </TableCell>
                <TableCell>
                  <AuctionStatusPill kind={pillForStatus(row.status)} label={row.status === "SOLD" ? translate("ขายแล้ว", "Sold") : undefined} />
                </TableCell>
                <TableCell className="pr-4 text-right" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-end gap-3">
                    <Link to={`/admin/auctions/${row.id}`} className={`${link} text-primary`}>
                      {suspended ? "ดูเหตุผล" : translate("ดู", "View")}
                    </Link>
                    {canSuspend(row.status) ? (
                      <button type="button" className={`${link} text-destructive`} onClick={() => onSuspend(row)}>
                        ระงับ
                      </button>
                    ) : null}
                  </div>
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

function TimeCell({ row, serverTime }: { row: AdminAuctionRow; serverTime: string }) {
  useLanguage();
  const cell = adminTimeCell(row);
  if (cell.kind === "countdown") return <AuctionCountdown target={row.endsAt} serverTime={serverTime} prefix="" />;
  if (cell.kind === "payment" && row.deadline) return <PaymentDue deadline={row.deadline} serverTime={serverTime} />;
  return <span className="text-xs text-muted-foreground">{cell.kind === "text" ? cell.text : ""}</span>;
}

function PaymentDue({ deadline, serverTime }: { deadline: string; serverTime: string }) {
  useLanguage();
  const remaining = useCountdown(deadline, serverTime) ?? 0;
  return <span className="text-xs text-muted-foreground tabular-nums">{translate("ชำระใน", "Pay within") + " "}{formatRemaining(remaining)}</span>;
}
