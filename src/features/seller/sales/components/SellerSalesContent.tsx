import { DataTable, type DataTableColumn } from "@/components/common";
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
import { intlLocale, useTranslate } from "@/lib/i18n";

const HEAD = "h-10 px-4 text-xs font-medium text-muted-foreground";
const CELL = "px-4 py-3 align-middle text-[13px] whitespace-normal";
const SUB = "block truncate text-[11px] text-muted-foreground";

/** แท็บ "ลดราคาสินค้า" ของ /seller/promotions?tab=sales (Figma SAL-S1) */
export function SellerSalesContent() {
  const { t } = useTranslate("sale");
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

  const columns: DataTableColumn<SellerSale>[] = [
    {
      id: "col0",
      header: t("seller.list.columns.sale", "การลดราคา"),
      meta: { headClassName: cn(HEAD, "w-[27%]"), cellClassName: CELL },
      cell: ({ row: { original: sale } }) => (
        <>
        <strong className="block truncate text-[13px] font-bold">{sale.name}</strong>
        <span className={SUB}>{sellerScopeLabel(sale)}</span>
        </>
      ),
    },
    {
      id: "col1",
      header: t("seller.list.columns.discount", "ส่วนลด"),
      meta: { headClassName: cn(HEAD, "w-[16%]"), cellClassName: CELL },
      cell: ({ row: { original: sale } }) => (
        <>
        <span className="block font-semibold">{sellerDiscountLabel(sale)}</span>
        <span className={SUB}>{sellerDiscountDetail(sale)}</span>
        </>
      ),
    },
    {
      id: "col2",
      header: t("seller.list.columns.items", "สินค้า"),
      meta: { headClassName: cn(HEAD, "w-[18%]"), cellClassName: CELL },
      cell: ({ row: { original: sale } }) => (
        <>
        <span className="block font-semibold">{sale.listingCount.toLocaleString(intlLocale())} listing</span>
        <span className={SUB}>{sale.soldUnits > 0 ? t("seller.list.sold", "ขายแล้ว {count} ชิ้น", { count: sale.soldUnits.toLocaleString(intlLocale()) }) : "—"}</span>
        </>
      ),
    },
    {
      id: "col3",
      header: t("seller.list.columns.period", "ระยะเวลา"),
      meta: { headClassName: cn(HEAD, "w-[18%]"), cellClassName: CELL },
      cell: ({ row: { original: sale } }) => (
        <>
        <span className="block truncate font-semibold">{salePeriod(sale)}</span>
        <span className={SUB}>{sellerPeriodHint(sale, now)}</span>
        </>
      ),
    },
    {
      id: "col4",
      header: t("seller.list.columns.status", "สถานะ"),
      meta: { headClassName: cn(HEAD, "w-[15%]"), cellClassName: CELL },
      cell: ({ row: { original: sale } }) => (
        <>
        <Badge className={cn("h-5 gap-1.5 rounded-full px-2 text-xs font-medium", SALE_STATUS_STYLE[sale.status])}>
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          {SALE_STATUS_LABEL[sale.status]}
        </Badge>
        </>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("seller.list.columns.actions", "จัดการ")}</span>,
      meta: { headClassName: cn(HEAD, "w-[6%]"), cellClassName: cn(CELL, "px-2 text-right") },
      cell: ({ row: { original: sale } }) => {
        const finished = isSaleFinished(sale.status);
        const paused = sale.status === "PAUSED";
        return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("seller.list.manage", "จัดการ {name}", { name: sale.name })} />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="w-44 min-w-44">
            {!finished && verified ? (
              <DropdownMenuItem render={<Link to={`/seller/sales/${sale.id}/edit`} />}>{t("seller.list.menu.edit", "แก้ไข")}</DropdownMenuItem>
            ) : null}
            {paused && sale.pausedByPegasus ? (
              <DropdownMenuItem onClick={() => setAction({ kind: "admin-paused", sale })}>{t("seller.list.menu.pauseReason", "ดูเหตุผลที่ทีมงานหยุด")}</DropdownMenuItem>
            ) : !finished ? (
              <DropdownMenuItem onClick={() => setAction({ kind: paused ? "resume" : "pause", sale })}>
                {paused ? t("seller.action.resume.confirm", "เปิดอีกครั้ง") : t("seller.action.pause.confirm", "หยุดชั่วคราว")}
              </DropdownMenuItem>
            ) : null}
            {sale.status === "ACTIVE" ? (
              <DropdownMenuItem onClick={() => setAction({ kind: "end", sale })}>{t("seller.list.menu.endEarly", "จบก่อนกำหนด")}</DropdownMenuItem>
            ) : null}
            {sale.soldUnits === 0 ? (
              <DropdownMenuItem variant="destructive" onClick={() => setAction({ kind: "delete", sale })}>
                {t("seller.action.delete.confirm", "ลบ")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        );
      },
    },
  ];

  return (
    <main className="grid w-full min-w-0 content-start gap-5 text-foreground">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{t("seller.title", "โปรโมชั่นของร้าน")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("seller.list.subtitle", "ลดราคาสินค้าให้ผู้ซื้อเห็นราคาใหม่ทันที ไม่ต้องใช้โค้ด · ร้านเป็นผู้ออกส่วนลด")}
          </p>
        </div>
        {verified ? (
          <Button render={<Link to="/seller/sales/new" />} nativeButton={false}>
            <Plus className="size-4" />
            {t("seller.tabs.sales", "ลดราคาสินค้า")}
          </Button>
        ) : (
          <Button disabled title={t("seller.list.verifyFirst", "ร้านต้องผ่านการยืนยันก่อน")}>
            <Plus className="size-4" />
            {t("seller.tabs.sales", "ลดราคาสินค้า")}
          </Button>
        )}
      </header>

      <SellerPromotionPageTabs value="sales" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t("seller.list.kpi.active", "กำลังลดราคา")} value={String(s?.activeSales ?? 0)} note={t("seller.list.kpi.scheduled", "{count} ตั้งเวลาไว้", { count: list.data?.statusCounts.SCHEDULED ?? 0 })} />
        <Kpi
          label={t("seller.list.kpi.listings", "Listing ที่ลดอยู่")}
          value={(s?.listingsOnSale ?? 0).toLocaleString(intlLocale())}
          note={t("seller.list.kpi.listingsNote", "ด้วยราคาลดของร้าน")}
        />
        <Kpi
          label={t("seller.list.kpi.revenue", "ยอดขายจากราคาลด (30 วัน)")}
          value={formatSaleBaht(s?.saleSales30d)}
          note={t("seller.list.kpi.revenueNote", "ยอดที่ผู้ซื้อจ่ายในออเดอร์ที่ชำระแล้ว")}
        />
        <Kpi label={t("seller.list.kpi.discount", "ส่วนลดที่ร้านออก (30 วัน)")} value={formatSaleBaht(s?.shopDiscount30d)} note={t("seller.list.kpi.discountNote", "คอมมิชชั่นคิดจากราคาที่ลดแล้ว")} />
      </div>

      <Card className="gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-none ring-0">
        {list.isPending ? <p className="p-6 text-sm text-muted-foreground">{t("seller.list.loading", "กำลังโหลดการลดราคา...")}</p> : null}
        {list.isError ? (
          <p role="alert" className="p-6 text-sm text-destructive">
            {t("seller.list.loadFailed", "โหลดการลดราคาไม่สำเร็จ")}{" "}
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void list.refetch()}>
              {t("seller.retry", "ลองอีกครั้ง")}
            </Button>
          </p>
        ) : null}
        {list.data && rows.length === 0 ? (
          <Empty className="m-5 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BadgePercent />
              </EmptyMedia>
              <EmptyTitle>{t("seller.list.empty.title", "ยังไม่มีการลดราคา")}</EmptyTitle>
              <EmptyDescription>{t("seller.list.empty.description", "ตั้งราคาลดให้สินค้า ผู้ซื้อเห็นราคาใหม่ทันทีโดยไม่ต้องใช้โค้ด")}</EmptyDescription>
            </EmptyHeader>
            {verified ? (
              <EmptyContent>
                <Button size="sm" render={<Link to="/seller/sales/new" />} nativeButton={false}>
                  <Plus />
                  {t("seller.tabs.sales", "ลดราคาสินค้า")}
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : null}
        {rows.length > 0 ? (
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(sale) => String(sale.id)}
            tableClassName="min-w-[760px] table-fixed"
            headerRowClassName="bg-muted hover:bg-muted"
            rowClassName={() => "h-[57px]"}
          />
        ) : null}
        {totalPages > 1 ? (
          <nav aria-label={t("seller.list.pagination", "หน้ารายการลดราคา")} className="flex items-center justify-end gap-2 border-t px-4 py-3">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => goPage(page - 1)}>
              {t("actions.previous", "ก่อนหน้า", { ns: "common" })}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t("seller.list.page", "หน้า {page} / {total}", { page: page + 1, total: totalPages })}
            </span>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => goPage(page + 1)}>
              {t("actions.next", "ถัดไป", { ns: "common" })}
            </Button>
          </nav>
        ) : null}
      </Card>

      <PlatformCampaignCard listings={platform.data ?? []} loading={platform.isPending} />

      <Alert className="rounded-xl border-[#fde4bd] bg-[#fff1db] px-4 py-3.5 text-[#956019]">
        <Info />
        <AlertDescription className="text-[13px] text-[#956019]">
          {t("seller.list.note", "ราคาขีดฆ่า = ราคา listing ปัจจุบัน · ระหว่างการลดราคาที่ตั้งเวลาไว้หรือกำลังลด ขึ้นราคา listing ไม่ได้ · 1 listing ใช้ราคาลดได้ทีละรายการ ถ้าอยู่ในแคมเปญ Pegasus ด้วย ผู้ซื้อเห็นราคาที่ต่ำกว่า · โค้ดส่วนลดยังใช้ซ้อนได้")}
        </AlertDescription>
      </Alert>

      <SellerSaleActionDialog action={action} onChange={setAction} />
    </main>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="flex min-w-0 flex-col gap-1 rounded-xl border border-border p-4 shadow-none ring-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <strong className="text-2xl font-extrabold">{value}</strong>
      <small className="text-xs text-muted-foreground">{note}</small>
    </Card>
  );
}

/** การ์ด "สินค้าของคุณในแคมเปญ Pegasus" (Figma SAL-S1) — ราคาล็อก ขึ้นราคาไม่ได้ระหว่างแคมเปญ */
function PlatformCampaignCard({ listings, loading }: { listings: PlatformSaleListing[]; loading: boolean }) {
  const { t } = useTranslate("sale");
  if (!loading && listings.length === 0) return null;
  const endLabel = new Intl.DateTimeFormat(intlLocale({ calendar: "gregory" }), { day: "numeric", month: "short" });
  return (
    <Card className="gap-0 rounded-xl border border-border p-5 shadow-none ring-0">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-bold">{t("seller.pegasus.title", "สินค้าของคุณในแคมเปญ Pegasus")}</h2>
        <SaleBadge type="pegasus" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("seller.pegasus.description", "Pegasus ออกส่วนลดให้ · คุณได้เงินเต็มราคาตั้งต้น · ระหว่างแคมเปญขึ้นราคา listing เหล่านี้ไม่ได้ (ลดได้)")}
      </p>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">{t("seller.pegasus.loading", "กำลังโหลด…")}</p> : null}
      <ul className="mt-3 divide-y border-t">
        {listings.map((item) => (
          <li key={`${item.saleId}-${item.listingId}`} className="grid items-center gap-3 py-3.5 sm:grid-cols-[1.2fr_1fr_auto]">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {item.productName} · {CONDITION_LABELS[item.condition] ?? item.condition}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {t("seller.pegasus.item", "{name} · ลด {percent}%", { name: item.saleName, percent: discountPercent(item) })}
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
              <span>{t("seller.pegasus.until", "ถึง {date}", { date: endLabel.format(new Date(item.endsAt)) })}</span>
              {item.priceLocked ? (
                <span className="inline-flex items-center gap-1 font-medium text-[#b45309]">
                  <Lock className="size-3" aria-hidden />
                  {t("seller.pegasus.locked", "ล็อกราคา")}
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
