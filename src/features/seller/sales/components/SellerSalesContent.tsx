import { translate, useLanguage } from "@/lib/language";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BadgePercent, Info, Lock, MoreVertical, Plus } from "lucide-react";

import { PriceTag, SaleBadge, formatSaleBaht } from "@/components/sale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONDITION_LABELS } from "@/features/catalog/catalog.mappers";
import { useSellerProfile } from "@/features/seller/shared/seller.queries";
import { cn } from "@/lib/utils";

import {
  SALE_STATUS_LABEL,
  SALE_STATUS_STYLE,
  isSaleFinished,
  salePeriod,
  sellerDiscountDetail,
  sellerDiscountLabel,
  sellerPeriodHint,
  sellerScopeLabel,
} from "../sales.format";
import { usePlatformListings, useSellerSaleSummary, useSellerSales } from "../sales.queries";
import type { PlatformSaleListing, SellerSale } from "../sales.types";
import { SellerPromotionPageTabs } from "./SellerPromotionPageTabs";
import { SellerSaleActionDialog, type SellerSaleActionState } from "./SellerSaleActionDialog";

const HEAD = "h-10 px-4 text-xs font-medium text-muted-foreground";
const CELL = "px-4 py-3 align-middle text-[13px] whitespace-normal";
const SUB = "block truncate text-[11px] text-muted-foreground";

/** แท็บ "ลดราคาสินค้า" ของ /seller/promotions?tab=sales (Figma SAL-S1) */
export function SellerSalesContent() {
  useLanguage();
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, (Number(params.get("page")) || 1) - 1);
  const profile = useSellerProfile();
  const verified = profile.data?.status === "VERIFIED";
  const list = useSellerSales(undefined, page);
  const summary = useSellerSaleSummary();
  const platform = usePlatformListings();
  const [action, setAction] = useState<SellerSaleActionState | null>(null);
  const [now] = useState(() => Date.now());
  const rows = list.data?.page.items ?? [];
  const totalPages = Math.max(1, list.data?.page.totalPages ?? 1);
  const s = summary.data;

  const goPage = (next: number) => {
    const search = new URLSearchParams(params);
    search.set("tab", "sales");
    if (next === 0) search.delete("page");
    else search.set("page", String(next + 1));
    setParams(search, { replace: true });
  };

  return (
    <main className="grid w-full min-w-0 content-start gap-5 text-foreground">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{translate("โปรโมชั่นของร้าน", "Shop promotions")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            ลดราคาสินค้าให้ผู้ซื้อเห็นราคาใหม่ทันที ไม่ต้องใช้โค้ด · ร้านเป็นผู้ออกส่วนลด
          </p>
        </div>
        {verified ? (
          <Button render={<Link to="/seller/sales/new" />} nativeButton={false}>
            <Plus className="size-4" />
            {translate("ลดราคาสินค้า", "Product discounts")}</Button>
        ) : (
          <Button disabled title="ร้านต้องผ่านการยืนยันก่อน">
            <Plus className="size-4" />
            {translate("ลดราคาสินค้า", "Product discounts")}</Button>
        )}
      </header>

      <SellerPromotionPageTabs value="sales" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={translate("กำลังลดราคา", "On sale")} value={String(s?.activeSales ?? 0)} note={`${list.data?.statusCounts.SCHEDULED ?? 0} ตั้งเวลาไว้`} />
        <Kpi
          label="Listing ที่ลดอยู่"
          value={(s?.listingsOnSale ?? 0).toLocaleString("th-TH")}
          note="ด้วยราคาลดของร้าน"
        />
        <Kpi
          label={translate("ยอดขายจากราคาลด (30 วัน)", "Discounted sales (30 days)")}
          value={formatSaleBaht(s?.saleSales30d)}
          note="ยอดที่ผู้ซื้อจ่ายในออเดอร์ที่ชำระแล้ว"
        />
        <Kpi label="ส่วนลดที่ร้านออก (30 วัน)" value={formatSaleBaht(s?.shopDiscount30d)} note="คอมมิชชั่นคิดจากราคาที่ลดแล้ว" />
      </div>

      <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0">
        {list.isPending ? <p className="p-6 text-sm text-muted-foreground">กำลังโหลดการลดราคา...</p> : null}
        {list.isError ? (
          <p role="alert" className="p-6 text-sm text-destructive">
            โหลดการลดราคาไม่สำเร็จ{" "}
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void list.refetch()}>
              {translate("ลองอีกครั้ง", "Try again")}</Button>
          </p>
        ) : null}
        {list.data && rows.length === 0 ? (
          <Empty className="m-5 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BadgePercent />
              </EmptyMedia>
              <EmptyTitle>ยังไม่มีการลดราคา</EmptyTitle>
              <EmptyDescription>ตั้งราคาลดให้สินค้า ผู้ซื้อเห็นราคาใหม่ทันทีโดยไม่ต้องใช้โค้ด</EmptyDescription>
            </EmptyHeader>
            {verified ? (
              <EmptyContent>
                <Button size="sm" render={<Link to="/seller/sales/new" />} nativeButton={false}>
                  <Plus />
                  {translate("ลดราคาสินค้า", "Product discounts")}</Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : null}
        {rows.length > 0 ? (
          <Table className="min-w-[760px] table-fixed">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className={cn(HEAD, "w-[27%]")}>การลดราคา</TableHead>
                <TableHead className={cn(HEAD, "w-[16%]")}>{translate("ส่วนลด", "Discount")}</TableHead>
                <TableHead className={cn(HEAD, "w-[18%]")}>{translate("สินค้า", "Products")}</TableHead>
                <TableHead className={cn(HEAD, "w-[18%]")}>{translate("ระยะเวลา", "Duration")}</TableHead>
                <TableHead className={cn(HEAD, "w-[15%]")}>{translate("สถานะ", "Status")}</TableHead>
                <TableHead className={cn(HEAD, "w-[6%]")}>
                  <span className="sr-only">{translate("จัดการ", "Manage")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((sale) => (
                <SaleRow key={sale.id} sale={sale} now={now} verified={verified} onAction={setAction} />
              ))}
            </TableBody>
          </Table>
        ) : null}
        {totalPages > 1 ? (
          <nav aria-label="หน้ารายการลดราคา" className="flex items-center justify-end gap-2 border-t px-4 py-3">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => goPage(page - 1)}>
              {translate("ก่อนหน้า", "Previous")}</Button>
            <span className="text-xs text-muted-foreground">
              {translate("หน้า", "Page") + " "}{page + 1} / {totalPages}
            </span>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => goPage(page + 1)}>
              {translate("ถัดไป", "Next")}</Button>
          </nav>
        ) : null}
      </Card>

      <PlatformCampaignCard listings={platform.data ?? []} loading={platform.isPending} />

      <Alert className="rounded-xl border-[#fde4bd] bg-[#fff1db] px-4 py-3.5 text-[#956019]">
        <Info />
        <AlertDescription className="text-[13px] text-[#956019]">
          ราคาขีดฆ่า = ราคา listing ปัจจุบัน · ระหว่างการลดราคาที่ตั้งเวลาไว้หรือกำลังลด ขึ้นราคา listing ไม่ได้ · 1 listing
          ใช้ราคาลดได้ทีละรายการ ถ้าอยู่ในแคมเปญ Pegasus ด้วย ผู้ซื้อเห็นราคาที่ต่ำกว่า · โค้ดส่วนลดยังใช้ซ้อนได้
        </AlertDescription>
      </Alert>

      <SellerSaleActionDialog action={action} onChange={setAction} />
    </main>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  useLanguage();
  return (
    <Card className="flex min-w-0 flex-col gap-1 rounded-xl border border-border p-4 shadow-none ring-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <strong className="text-2xl font-extrabold">{value}</strong>
      <small className="text-xs text-muted-foreground">{note}</small>
    </Card>
  );
}

function SaleRow({
  sale,
  now,
  verified,
  onAction,
}: {
  sale: SellerSale;
  now: number;
  verified: boolean;
  onAction: (action: SellerSaleActionState) => void;
}) {
  useLanguage();
  const finished = isSaleFinished(sale.status);
  const paused = sale.status === "PAUSED";
  return (
    <TableRow className="h-[57px]">
      <TableCell className={CELL}>
        <strong className="block truncate text-[13px] font-bold">{sale.name}</strong>
        <span className={SUB}>{sellerScopeLabel(sale)}</span>
      </TableCell>
      <TableCell className={CELL}>
        <span className="block font-semibold">{sellerDiscountLabel(sale)}</span>
        <span className={SUB}>{sellerDiscountDetail(sale)}</span>
      </TableCell>
      <TableCell className={CELL}>
        <span className="block font-semibold">{sale.listingCount.toLocaleString("th-TH")} listing</span>
        <span className={SUB}>{sale.soldUnits > 0 ? `ขายแล้ว ${sale.soldUnits.toLocaleString("th-TH")} ชิ้น` : "—"}</span>
      </TableCell>
      <TableCell className={CELL}>
        <span className="block truncate font-semibold">{salePeriod(sale)}</span>
        <span className={SUB}>{sellerPeriodHint(sale, now)}</span>
      </TableCell>
      <TableCell className={CELL}>
        <Badge className={cn("h-5 gap-1.5 rounded-full px-2 text-xs font-medium", SALE_STATUS_STYLE[sale.status])}>
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          {SALE_STATUS_LABEL[sale.status]}
        </Badge>
      </TableCell>
      <TableCell className={cn(CELL, "px-2 text-right")}>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`จัดการ ${sale.name}`} />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-44 min-w-44">
            {!finished && verified ? (
              <DropdownMenuItem render={<Link to={`/seller/sales/${sale.id}/edit`} />}>{translate("แก้ไข", "Edit")}</DropdownMenuItem>
            ) : null}
            {paused && sale.pausedByPegasus ? (
              <DropdownMenuItem onClick={() => onAction({ kind: "admin-paused", sale })}>ดูเหตุผลที่ทีมงานหยุด</DropdownMenuItem>
            ) : !finished ? (
              <DropdownMenuItem onClick={() => onAction({ kind: paused ? "resume" : "pause", sale })}>
                {paused ? translate("เปิดอีกครั้ง", "Reopen") : translate("หยุดชั่วคราว", "Paused")}
              </DropdownMenuItem>
            ) : null}
            {sale.status === "ACTIVE" ? (
              <DropdownMenuItem onClick={() => onAction({ kind: "end", sale })}>{translate("จบก่อนกำหนด", "End early")}</DropdownMenuItem>
            ) : null}
            {sale.soldUnits === 0 ? (
              <DropdownMenuItem variant="destructive" onClick={() => onAction({ kind: "delete", sale })}>
                {translate("ลบ", "Delete")}</DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

/** การ์ด "สินค้าของคุณในแคมเปญ Pegasus" (Figma SAL-S1) — ราคาล็อก ขึ้นราคาไม่ได้ระหว่างแคมเปญ */
function PlatformCampaignCard({ listings, loading }: { listings: PlatformSaleListing[]; loading: boolean }) {
  useLanguage();
  if (!loading && listings.length === 0) return null;
  const endLabel = new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short" });
  return (
    <Card className="gap-0 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-bold">สินค้าของคุณในแคมเปญ Pegasus</h2>
        <SaleBadge type="pegasus" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Pegasus ออกส่วนลดให้ · คุณได้เงินเต็มราคาตั้งต้น · ระหว่างแคมเปญขึ้นราคา listing เหล่านี้ไม่ได้ (ลดได้)
      </p>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">{translate("กำลังโหลด…", "Loading…")}</p> : null}
      <ul className="mt-3 divide-y border-t">
        {listings.map((item) => (
          <li key={`${item.saleId}-${item.listingId}`} className="grid items-center gap-3 py-3.5 sm:grid-cols-[1.2fr_1fr_auto]">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {item.productName} · {CONDITION_LABELS[item.condition] ?? item.condition}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {item.saleName} · ลด {discountPercent(item)}%
              </p>
            </div>
            <PriceTag
              pricing={{
                listPrice: item.listPrice,
                salePrice: item.salePrice,
                discountPercent: discountPercent(item),
                // API ไม่บอกประเภทแคมเปญของแถวนี้ — แสดงแบบลดราคาทั่วไป
                sale: { id: item.saleId, slug: item.saleSlug, name: item.saleName, type: "CATEGORY_SALE", endsAt: item.endsAt, quotaLeft: null, perBuyerLimit: null },
              }}
            />
            <div className="flex items-center gap-4 text-xs text-muted-foreground sm:justify-end">
              <span>ถึง {endLabel.format(new Date(item.endsAt))}</span>
              {item.priceLocked ? (
                <span className="inline-flex items-center gap-1 font-medium text-[#b45309]">
                  <Lock className="size-3" aria-hidden />
                  ล็อกราคา
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** % ส่วนลดเต็มหน่วย — คิดแบบเดียวกับ `SalePricing.discountPercent` ของ backend */
function discountPercent(item: Pick<PlatformSaleListing, "listPrice" | "salePrice">): number {
  if (item.listPrice <= 0) return 0;
  return Math.round((100 * (item.listPrice - item.salePrice)) / item.listPrice);
}
