import { useEffect, useState } from "react";

import { SearchXIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { QueryBoundary, DataTable, type DataTableColumn } from "@/components/common";
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
import { Separator } from "@/components/ui/separator";
import { formatAuctionShortDateTime, formatBaht } from "@/features/auction/auction.format";
import { useSellerAuction } from "@/features/auction/auction.queries";
import type { SellerAuctionDetail } from "@/features/auction/auction.types";
import { AuctionCountdown } from "@/features/auction/components/AuctionCountdown";
import { AuctionStatusPill } from "@/features/auction/components/AuctionStatusPill";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { sellerAuctionRowView } from "./auctions-table.format";
import { AuctionTimeline } from "./components/AuctionTimeline";
import { CancelAuctionDialog } from "./components/CancelAuctionDialog";
import { EditBuyNowDialog } from "./components/EditBuyNowDialog";
import { SellerAuctionNotices } from "./components/SellerAuctionNotices";
import {
  buyNowSetting,
  headerMeta,
  isFirstBid,
  relistPath,
  timelineSteps,
  toSellerAuctionRow,
} from "./seller-auction-detail.format";

function parseAuctionId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** `/seller/auctions/:auctionId` — รายละเอียดประมูลฝั่งผู้ขาย ตาม Figma S4 (2308:8540) [TCG-634 · FE-8] */
export function SellerAuctionDetailPage() {
  const { auctionId } = useParams();
  const id = parseAuctionId(auctionId);
  const auction = useSellerAuction(id);

  // กดจากแถวล่าง ๆ ของตาราง S1 ไม่ให้เปิดมาค้างกลางหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [auctionId]);

  // เลขไม่ใช่ตัวเลข หรือเป็นของร้านอื่น (backend ตอบ 404 ไม่บอกว่ามีอยู่จริง)
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
          <Button variant="outline" size="sm" className="rounded-md px-2.5" render={<Link to="/seller/auctions" />} nativeButton={false}>
            การประมูลของฉัน
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <QueryBoundary query={auction} loading={<DashboardPageSkeleton label="กำลังโหลดการประมูล" />} errorTitle="โหลดการประมูลไม่สำเร็จ">
      {/* key ตาม id — สลับไปใบอื่นแล้วตัวจับบิดใหม่ต้องเริ่มนับใหม่ */}
      {(detail) => <SellerAuctionDetailContent key={detail.id} detail={detail} />}
    </QueryBoundary>
  );
}

export function SellerAuctionDetailContent({ detail }: { detail: SellerAuctionDetail }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // เปิด dialog แก้ราคาใหม่ทุกครั้ง ให้เริ่มจากค่าล่าสุด
  const [editKey, setEditKey] = useState(0);

  // มีบิดเพิ่มจากรอบ poll ระหว่างเปิดหน้า → แบนเนอร์ "มีบิดใหม่"
  const [seenBidCount, setSeenBidCount] = useState(detail.bidCount);
  const [newBid, setNewBid] = useState(false);
  if (detail.bidCount !== seenBidCount) {
    if (detail.bidCount > seenBidCount) setNewBid(true);
    setSeenBidCount(detail.bidCount);
  }

  const row = toSellerAuctionRow(detail);
  const { pill } = sellerAuctionRowView(row);
  const live = detail.status === "LIVE";
  const hasBids = detail.bidCount > 0;
  const { card } = detail.item;

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/seller/auctions" />}>การประมูลของฉัน</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">#{detail.auctionNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="h-[76px] w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
            {card.officialImageUrl ? <img src={card.officialImageUrl} alt="" className="size-full object-cover" /> : null}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="text-2xl font-bold text-foreground">{card.productName}</h1>
            <div className="flex flex-wrap items-center gap-2.5">
              <AuctionStatusPill kind={pill.kind} label={pill.label} />
              {live ? <AuctionCountdown target={detail.endsAt} serverTime={detail.serverTime} /> : null}
              <span className="text-xs text-muted-foreground">{headerMeta(detail)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-md px-2.5" render={<Link to={`/auctions/${detail.id}`} />} nativeButton={false}>
              ดูหน้าประมูล
            </Button>
            {live ? (
              <Button
                variant={detail.cancellable ? "outline" : "secondary"}
                size="sm"
                className={cn("rounded-md px-2.5", detail.cancellable && "text-destructive")}
                disabled={!detail.cancellable}
                onClick={() => setCancelOpen(true)}
              >
                ยกเลิกประมูล
              </Button>
            ) : null}
            {detail.status === "UNSOLD" ? (
              <Button size="sm" className="rounded-md px-2.5" render={<Link to={relistPath(detail.id)} />} nativeButton={false}>
                ประมูลใหม่
              </Button>
            ) : null}
          </div>
          {live && hasBids ? <p className="text-[11px] text-muted-foreground">ยกเลิกไม่ได้ — มีผู้บิดแล้ว</p> : null}
        </div>
      </div>

      <SellerAuctionNotices detail={detail} newBid={newBid} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="ราคาบิดสูงสุด"
          value={hasBids ? formatBaht(detail.currentPrice) : "—"}
          valueClass={hasBids ? "text-primary" : undefined}
          note={`เริ่มต้น ${formatBaht(detail.startingPrice)}`}
        />
        <Kpi label="จำนวนบิด" value={detail.bidCount.toLocaleString("th-TH")} note={`จาก ${detail.bidderCount.toLocaleString("th-TH")} ผู้บิด`} />
        <Kpi label="ผู้ติดตาม" value={detail.watcherCount.toLocaleString("th-TH")} note="กดติดตามประมูลนี้" />
        <Kpi
          label="รายรับโดยประมาณ"
          value={formatBaht(detail.estimatedPayout)}
          valueClass="text-emerald-700"
          note={`หลังค่าคอมมิชชั่น ${detail.commissionPercent}%`}
        />
      </div>

      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <BidHistoryCard detail={detail} />
        </div>
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <SettingsCard
            detail={detail}
            onEdit={() => {
              setEditKey((key) => key + 1);
              setEditOpen(true);
            }}
          />
          <AuctionTimeline steps={timelineSteps(detail)} />
        </div>
      </div>

      <CancelAuctionDialog row={row} open={cancelOpen} onOpenChange={setCancelOpen} />
      <EditBuyNowDialog key={editKey} detail={detail} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function Kpi({ label, value, note, valueClass }: { label: string; value: string; note: string; valueClass?: string }) {
  return (
    <Card className="gap-1 rounded-xl p-4 shadow-none">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums text-foreground", valueClass)}>{value}</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </Card>
  );
}

/** ตาราง "ประวัติการบิด" — ใหม่สุดก่อน ชื่อผู้บิดปิดบัง */
function BidHistoryCard({ detail }: { detail: SellerAuctionDetail }) {
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0 shadow-none">
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-base font-semibold text-foreground">ประวัติการบิด</p>
        <p className="text-xs text-muted-foreground">{detail.bidCount.toLocaleString("th-TH")} บิด</p>
      </div>
      {detail.bids.length === 0 ? (
        <p className="border-t border-border px-5 py-8 text-center text-sm text-muted-foreground">ยังไม่มีผู้บิด</p>
      ) : (
        <DataTable
          columns={[
            {
              id: "bidder",
              header: "ผู้บิด",
              meta: { headClassName: "pl-5 text-xs font-normal text-muted-foreground", cellClassName: "py-3 pl-5" },
              cell: ({ row }) => (
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {row.original.bidderAlias}
                  {row.index === 0 ? <AuctionStatusPill kind="Leading" label="สูงสุด" /> : null}
                </span>
              ),
            },
            {
              id: "amount",
              header: "ราคา",
              meta: { headClassName: "text-xs font-normal text-muted-foreground", cellClassName: "text-sm font-semibold tabular-nums" },
              cell: ({ row }) => <span className={row.index === 0 ? "text-primary" : "text-foreground"}>{formatBaht(row.original.amount)}</span>,
            },
            {
              id: "time",
              header: "เวลา",
              meta: { headClassName: "pr-5 text-xs font-normal text-muted-foreground", cellClassName: "pr-5 text-xs text-muted-foreground" },
              cell: ({ row }) => `${formatAuctionShortDateTime(row.original.placedAt)}${isFirstBid(row.original, detail) ? " · บิดแรก" : ""}`,
            },
          ] satisfies DataTableColumn<(typeof detail.bids)[number]>[]}
          data={detail.bids}
          getRowId={(bid) => `${bid.placedAt}-${bid.amount}`}
          headerRowClassName="bg-muted/40 hover:bg-muted/40"
        />
      )}
    </Card>
  );
}

/** การ์ด "การตั้งค่าประมูล" — แก้ราคาซื้อทันทีได้จนกว่าจะมีบิดแรก */
function SettingsCard({ detail, onEdit }: { detail: SellerAuctionDetail; onEdit: () => void }) {
  const extended = detail.extensionCount > 0;
  const rows: { label: string; value: string }[] = [
    { label: "ราคาเริ่มต้น", value: formatBaht(detail.startingPrice) },
    { label: "บิดขั้นต่ำครั้งละ", value: `+${formatBaht(detail.bidIncrement)}` },
    { label: "เปิดเมื่อ", value: formatAuctionShortDateTime(detail.startedAt) },
    { label: extended ? "ปิด (เดิม)" : "ปิด", value: formatAuctionShortDateTime(extended ? detail.originalEndsAt : detail.endsAt) },
    { label: "ซื้อทันที", value: buyNowSetting(detail) },
  ];

  return (
    <Card className="w-full gap-3 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-foreground">การตั้งค่าประมูล</p>
        {detail.editable ? (
          <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={onEdit}>
            แก้ไข
          </Button>
        ) : null}
      </div>
      <dl className="flex flex-col gap-2">
        {rows.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="text-right font-semibold text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
      <Separator />
      <div className="flex flex-col gap-1">
        <p className="text-[11px] text-muted-foreground">หมายเหตุถึงผู้ซื้อ</p>
        <p className="text-xs whitespace-pre-line text-foreground">{detail.sellerNote ?? "—"}</p>
      </div>
      {detail.bidCount > 0 ? <p className="text-[11px] text-muted-foreground">มีผู้บิดแล้ว จึงแก้การตั้งค่าไม่ได้</p> : null}
    </Card>
  );
}
