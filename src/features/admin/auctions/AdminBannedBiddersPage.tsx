import { translate, useLanguage } from "@/lib/language";
import { useState } from "react";

import { Info, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary } from "@/components/common";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBannedBidders } from "@/features/auction/auction.queries";
import type { BannedBidder, BanTab } from "@/features/auction/auction.types";
import { ProductTableSkeleton } from "@/features/seller/products/components/ProductTableSkeleton";
import { downloadCsv } from "@/lib/csv";

import { BAN_TABS, canLiftBan, formatDayMonthYear, latestStrike, memberAge, readBanTab } from "./admin-auctions.format";
import { AdminKpi, AdminSearchBox, AdminTabs } from "./components/AdminAuctionShared";
import { LiftBanDialog } from "./components/LiftBanDialog";
import { StrikeDots } from "./components/StrikeDots";

type OpenDialog = { bidder: BannedBidder; mode: "lift" | "history" };

/** `/admin/auctions/banned-bidders` — A4 ผู้ใช้ที่ถูกห้ามบิด ตาม Figma 2309:8795 [TCG-635 · FE-9] */
export function AdminBannedBiddersPage() {
  useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = readBanTab(searchParams.get("tab"));
  const search = searchParams.get("q") ?? "";
  const bidders = useBannedBidders({ tab, q: search || undefined });
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function updateParams(changes: { tab?: BanTab; q?: string }) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (changes.tab !== undefined) {
          if (changes.tab === "BANNED") next.delete("tab");
          else next.set("tab", changes.tab);
        }
        if (changes.q !== undefined) {
          if (changes.q.trim()) next.set("q", changes.q.trim());
          else next.delete("q");
        }
        return next;
      },
      { replace: true },
    );
  }

  const open = (bidder: BannedBidder, mode: OpenDialog["mode"]) => {
    setDialog({ bidder, mode });
    setDialogOpen(true);
  };

  const data = bidders.data;

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`banned-bidders-${tab.toLowerCase()}.csv`, [
      [translate("ผู้ใช้", "User"), translate("อีเมล", "Email"), translate("ไม่ชำระ", "Unpaid"), translate("ครั้งล่าสุด", "Last occurrence"), translate("ห้ามบิดถึง", "Bidding banned until")],
      ...data.page.items.map((b) => [b.username, b.maskedEmail, `${b.strikeCount}/${b.strikeLimit}`, latestStrike(b), b.bannedUntil ? formatDayMonthYear(b.bannedUntil) : ""]),
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList className="gap-1.5 text-xs text-gray-500 sm:gap-1.5">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/admin/auctions" />}>{translate("การประมูลทั้งหมด", "All auctions")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-500 [&>svg]:size-4" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-gray-700">{translate("ผู้ใช้ที่ถูกห้ามบิด", "Banned bidders")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">{translate("ผู้ใช้ที่ถูกห้ามบิด", "Banned bidders")}</h1>
          <p className="text-[13px] text-muted-foreground">
            ระบบห้ามบิดอัตโนมัติเมื่อไม่ชำระหลังชนะครบ 3 ครั้ง · แอดมินยกเลิกโทษได้ถ้าไม่ใช่ความผิดของผู้ใช้
          </p>
        </div>
        <Button variant="outline" className="rounded-md px-2.5" disabled={!data} onClick={exportCsv}>
          {translate("ส่งออก CSV", "Export CSV")}</Button>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        ไม่ชำระ 1–2 ครั้ง = เตือน · ครบ 3 ครั้ง = ห้ามบิด 30 วัน · ผู้ที่ถูกห้ามยังซื้อสินค้าปกติได้ · ตัวนับรีเซ็ตเมื่อพ้นโทษ
      </p>

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminKpi label={translate("ห้ามบิดอยู่", "Bidding banned")} value={data.tabCounts.BANNED} valueClass="text-red-700" />
          <AdminKpi label="ใกล้ถูกห้าม (2/3)" value={data.tabCounts.AT_RISK} valueClass="text-amber-800" />
          <AdminKpi label="ยกเลิกโทษแล้ว (30 วัน)" value={data.liftedLast30Days} />
          <AdminKpi label="พ้นโทษแล้ว (30 วัน)" value={data.expiredLast30Days} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTabs label="สถานะโทษ" tabs={BAN_TABS} active={tab} counts={data?.tabCounts} onChange={(next) => updateParams({ tab: next })} />
        <AdminSearchBox value={search} placeholder="ค้นหาชื่อผู้ใช้หรืออีเมล…" onChange={(q) => updateParams({ q })} />
      </div>

      <QueryBoundary
        query={bidders}
        loading={<ProductTableSkeleton />}
        errorTitle="โหลดรายชื่อไม่สำเร็จ"
        isEmpty={(result) => result.page.items.length === 0}
        empty={<EmptyState icon={ShieldCheck} title="ไม่มีผู้ใช้ที่ถูกห้ามบิด" description="ผู้ที่ไม่ชำระหลังชนะครบ 3 ครั้งจะแสดงที่นี่โดยอัตโนมัติ" />}
      >
        {(result) => <BannedBiddersTable bidders={result.page.items} onOpen={open} />}
      </QueryBoundary>

      <LiftBanDialog
        key={dialog ? `${dialog.mode}-${dialog.bidder.userId}` : "none"}
        bidder={dialog?.bidder ?? null}
        mode={dialog?.mode ?? "history"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function BannedBiddersTable({ bidders, onOpen }: { bidders: BannedBidder[]; onOpen: (bidder: BannedBidder, mode: OpenDialog["mode"]) => void }) {
  useLanguage();
  const head = "text-xs font-normal text-muted-foreground";
  const action = "cursor-pointer text-xs font-semibold text-primary hover:underline";
  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-0 shadow-none">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={`pl-4 ${head}`}>{translate("ผู้ใช้", "User")}</TableHead>
            <TableHead className={head}>{translate("ไม่ชำระ", "Unpaid")}</TableHead>
            <TableHead className={head}>{translate("ครั้งล่าสุด", "Last occurrence")}</TableHead>
            <TableHead className={head}>{translate("ห้ามบิดถึง", "Bidding banned until")}</TableHead>
            <TableHead className="pr-4">
              <span className="sr-only">{translate("การกระทำ", "Action")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bidders.map((bidder) => (
            <TableRow key={bidder.userId}>
              <TableCell className="py-3 pl-4">
                <p className="text-sm font-semibold text-foreground">{bidder.username}</p>
                <p className="text-[11px] text-muted-foreground">
                  {bidder.maskedEmail} · สมาชิก {memberAge(bidder.memberSince)}
                </p>
              </TableCell>
              <TableCell>
                <StrikeDots count={bidder.strikeCount} limit={bidder.strikeLimit} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{latestStrike(bidder)}</TableCell>
              <TableCell className="text-sm font-semibold text-red-700">
                {bidder.bannedUntil && canLiftBan(bidder) ? formatDayMonthYear(bidder.bannedUntil) : <span className="text-xs font-normal text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button type="button" className={action} onClick={() => onOpen(bidder, "history")}>
                    ดูประวัติ
                  </button>
                  {canLiftBan(bidder) ? (
                    <button type="button" className={action} onClick={() => onOpen(bidder, "lift")}>
                      {translate("ยกเลิกโทษ", "Lift ban")}</button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
