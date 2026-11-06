import { useState, type ReactNode } from "react";

import { ArrowRight, Flag, SearchXIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { QueryBoundary } from "@/components/common";
import { DashboardPageSkeleton } from "@/components/common/PageSkeletons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAuctionShortDateTime, formatBaht, pillForStatus } from "@/features/auction/auction.format";
import { useAdminAuction } from "@/features/auction/auction.queries";
import type { AdminAuctionDetail } from "@/features/auction/auction.types";
import { AuctionCountdown } from "@/features/auction/components/AuctionCountdown";
import { AuctionStatusPill } from "@/features/auction/components/AuctionStatusPill";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { BID_SIGNAL_LABEL, bidderMeta, canSuspend, detailFlags, formatBidSecond } from "./admin-auctions.format";
import { RiskFlag } from "./components/RiskFlag";
import { SuspendAuctionDialog } from "./components/SuspendAuctionDialog";

function parseAuctionId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** `/admin/auctions/:auctionId` — A3 รายละเอียดประมูล ตาม Figma 2309:8276 [TCG-635 · FE-9] */
export function AdminAuctionDetailPage() {
  const { auctionId } = useParams();
  const id = parseAuctionId(auctionId);
  const auction = useAdminAuction(id);

  if (id === null || (auction.isError && auction.error instanceof ApiError && auction.error.status === 404)) {
    return (
      <Empty className="rounded-xl border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>ไม่พบการประมูลนี้</EmptyTitle>
          <EmptyDescription>การประมูลอาจถูกนำออก หรือ URL ไม่ถูกต้อง</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" className="rounded-md px-2.5" render={<Link to="/admin/auctions" />} nativeButton={false}>
            การประมูลทั้งหมด
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <QueryBoundary query={auction} loading={<DashboardPageSkeleton label="กำลังโหลดการประมูล" />} errorTitle="โหลดการประมูลไม่สำเร็จ">
      {(detail) => <AdminAuctionDetailContent key={detail.id} detail={detail} />}
    </QueryBoundary>
  );
}

export function AdminAuctionDetailContent({ detail }: { detail: AdminAuctionDetail }) {
  const [suspendOpen, setSuspendOpen] = useState(false);
  const { card } = detail.item;
  const live = detail.status === "LIVE";

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/admin/auctions" />}>การประมูลทั้งหมด</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">#{detail.auctionNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-[76px] w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
            {card.officialImageUrl ? <img src={card.officialImageUrl} alt="" className="size-full object-cover" /> : null}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="text-2xl font-bold text-foreground">{card.productName}</h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <AuctionStatusPill kind={pillForStatus(detail.status)} label={detail.status === "SOLD" ? "ขายแล้ว" : undefined} />
              {live ? <AuctionCountdown target={detail.endsAt} serverTime={detail.serverTime} /> : null}
              {detailFlags(detail).map((flag) => (
                <RiskFlag key={flag} label={flag} />
              ))}
              <span className="text-xs text-muted-foreground">
                ผู้ขาย {detail.seller.shopName} · {detail.item.condition} · {formatBaht(detail.currentPrice)} · {detail.bidCount} บิด
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md px-2.5" render={<Link to={`/auctions/${detail.id}`} />} nativeButton={false}>
            ดูหน้าประมูล
          </Button>
          {canSuspend(detail.status) ? (
            <Button
              variant="destructive"
              size="sm"
              className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90"
              onClick={() => setSuspendOpen(true)}
            >
              ระงับประมูล
            </Button>
          ) : null}
        </div>
      </div>

      {detail.signals.length > 0 ? (
        <div role="status" className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Flag aria-hidden className="size-4" />
            สัญญาณที่ควรตรวจสอบ ({detail.signals.length})
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-xs">
            {detail.signals.map((item) => (
              <li key={`${item.signal}-${item.message}`}>{item.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
          <p className="text-base font-semibold text-foreground">Log การบิดทั้งหมด (แสดงชื่อเต็ม)</p>
          <BidLogCard detail={detail} />
        </div>
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <SellerCard detail={detail} />
          <SettingsCard detail={detail} />
          <SideCard title="หมายเหตุจากผู้ขาย">
            <p className="text-xs whitespace-pre-line text-foreground">{detail.sellerNote ?? "—"}</p>
            {detail.sellerNoteUpdatedAt ? (
              <p className="text-[11px] text-muted-foreground">แก้ล่าสุด {formatAuctionShortDateTime(detail.sellerNoteUpdatedAt)}</p>
            ) : null}
          </SideCard>
          <AdminLogCard detail={detail} />
        </div>
      </div>

      <SuspendAuctionDialog
        target={{ id: detail.id, cardName: card.productName, auctionNumber: detail.auctionNumber, bidCount: detail.bidCount }}
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
      />
    </div>
  );
}

function BidLogCard({ detail }: { detail: AdminAuctionDetail }) {
  const head = "text-xs font-normal text-muted-foreground";
  if (detail.bids.length === 0) {
    return (
      <Card className="rounded-xl px-5 py-8 text-center shadow-none">
        <p className="text-sm text-muted-foreground">ยังไม่มีผู้บิด</p>
      </Card>
    );
  }
  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-0 shadow-none">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={`pl-4 ${head}`}>ผู้บิด</TableHead>
            <TableHead className={head}>ราคา</TableHead>
            <TableHead className={head}>เวลา</TableHead>
            <TableHead className={`pr-4 text-right ${head}`}>สัญญาณ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.bids.map((bid, index) => {
            const cancelled = bid.status === "CANCELLED";
            return (
              <TableRow key={bid.bidId} className={cn(cancelled && "opacity-60")}>
                <TableCell className="py-3 pl-4">
                  <p className={cn("text-sm font-semibold text-foreground", cancelled && "line-through")}>{bid.username}</p>
                  <p className="text-[11px] text-muted-foreground">{bidderMeta(bid.memberSince, bid.orderCount)}</p>
                </TableCell>
                <TableCell
                  className={cn("text-sm font-semibold tabular-nums", index === 0 && !cancelled ? "text-primary" : "text-foreground", cancelled && "line-through")}
                >
                  {formatBaht(bid.amount)}
                </TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">{formatBidSecond(bid.placedAt)}</TableCell>
                <TableCell className="pr-4 text-right">
                  {bid.signals.length > 0 ? (
                    <span className="inline-flex flex-wrap justify-end gap-1">
                      {bid.signals.map((signal) => (
                        <RiskFlag key={signal} label={BID_SIGNAL_LABEL[signal]} />
                      ))}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="w-full gap-2.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <p className="text-base font-semibold text-foreground">{title}</p>
      {children}
    </Card>
  );
}

function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="flex flex-col gap-2">
      {rows.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-3 text-xs">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="text-right font-semibold text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SellerCard({ detail }: { detail: AdminAuctionDetail }) {
  const { seller } = detail;
  return (
    <SideCard title="ผู้ขาย">
      <Rows
        rows={[
          { label: "ร้าน", value: seller.shopName },
          { label: "สถานะร้าน", value: seller.verified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน" },
          { label: "ประมูลทั้งหมด", value: seller.auctionCount.toLocaleString("th-TH") },
          { label: "เคยถูกระงับ", value: `${seller.suspensionCount} ครั้ง` },
        ]}
      />
      <Link
        to={`/admin/users?q=${encodeURIComponent(seller.username)}`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        ดูโปรไฟล์ผู้ขาย
        <ArrowRight aria-hidden className="size-3.5" />
      </Link>
    </SideCard>
  );
}

function SettingsCard({ detail }: { detail: AdminAuctionDetail }) {
  return (
    <SideCard title="การตั้งค่า">
      <Rows
        rows={[
          { label: "ราคาเริ่มต้น", value: formatBaht(detail.startingPrice) },
          { label: "บิดขั้นต่ำ", value: `+${formatBaht(detail.bidIncrement)}` },
          { label: "ปิด (เดิม)", value: formatAuctionShortDateTime(detail.originalEndsAt) },
          { label: "ต่อเวลาแล้ว", value: `${detail.extensionCount} ครั้ง` },
          { label: "ซื้อทันที", value: detail.buyNowPrice !== null ? formatBaht(detail.buyNowPrice) : "ไม่ได้ตั้ง" },
        ]}
      />
    </SideCard>
  );
}

function AdminLogCard({ detail }: { detail: AdminAuctionDetail }) {
  return (
    <SideCard title="บันทึกของแอดมิน">
      {detail.actions.length === 0 ? (
        <p className="text-xs text-muted-foreground">ยังไม่มีการดำเนินการ — การระงับ/ยกเลิกโทษจะถูกบันทึกที่นี่และในบันทึกกิจกรรม</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {detail.actions.map((action) => (
            <li key={`${action.action}-${action.at}`} className="flex flex-col gap-0.5 text-xs">
              <p className="font-semibold text-foreground">
                {action.action === "SUSPEND" ? "ระงับประมูล" : action.action} · {action.adminName}
              </p>
              {action.reason ? <p className="text-foreground">{action.reason}</p> : null}
              <p className="text-[11px] text-muted-foreground">{formatAuctionShortDateTime(action.at)}</p>
            </li>
          ))}
        </ul>
      )}
    </SideCard>
  );
}
