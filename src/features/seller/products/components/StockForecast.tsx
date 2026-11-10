import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getVisiblePages } from "../utils/pagination";
import { intlLocale, useTranslate, translate } from "@/lib/i18n";

type Forecast = {
  listingId: number;
  listingName: string;
  availableStock: number;
  completedSales30Days: number;
  status: "FORECAST_AVAILABLE" | "INSUFFICIENT_DATA" | "NO_SALES" | "OUT_OF_STOCK";
  daysRemaining: number | null;
  estimatedStockoutDate: string | null;
};

const PAGE_SIZE = 5;

function result(row: Forecast) {
  if (row.status === "OUT_OF_STOCK") return translate("seller", "products.forecast.outOfStock", "หมดสต็อก");
  if (row.status === "NO_SALES") return translate("seller", "products.forecast.noSales", "ยังไม่มีการขาย");
  if (row.daysRemaining == null || !row.estimatedStockoutDate) return translate("seller", "products.forecast.insufficient", "ข้อมูลยังไม่พอสำหรับคาดการณ์");
  return translate("seller", "products.forecast.estimate", "คาดว่าจะหมดใน ~{days} วัน · {date}", { days: row.daysRemaining, date: new Intl.DateTimeFormat(intlLocale(), { day: "numeric", month: "short", year: "numeric" }).format(new Date(row.estimatedStockoutDate)) });
}

function useForecasts() {
  return useQuery({
    queryKey: ["seller-stock-forecasts"],
    queryFn: () => api.get<Forecast[]>("/sellers/me/listings/stock-forecast"),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function StockForecast() {
  const { t } = useTranslate("seller");
  const forecast = useForecasts();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "soon" | "insufficient">("all");
  const [page, setPage] = useState(1);
  const rows = forecast.data ?? [];
  const nearest = [...rows].sort((a, b) =>
    (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity) || a.listingId - b.listingId,
  ).slice(0, 2);
  const filtered = rows.filter((row) => {
    if (!row.listingName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) return false;
    if (filter === "soon") return row.status === "FORECAST_AVAILABLE" && row.availableStock > 0 && row.daysRemaining != null && row.daysRemaining <= 14;
    if (filter === "insufficient") return row.status === "INSUFFICIENT_DATA" || row.status === "NO_SALES";
    return true;
  }).sort((a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const visiblePages = getVisiblePages(currentPage, pages);

  return <>
    <section aria-label={t("products.forecast.title", "คาดการณ์การเติมสต็อก")} className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-bold text-foreground">{t("products.forecast.title", "คาดการณ์การเติมสต็อก")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("products.forecast.subtitle", "แสดง 2 รายการที่คาดว่าจะหมดเร็วที่สุด · อิงยอดขายสำเร็จ 30 วันล่าสุด")}</p></div>
        <Button variant="outline" size="sm" onClick={() => { void forecast.refetch(); setOpen(true); }}>{t("products.forecast.viewAll", "ดูทั้งหมด")}</Button>
      </div>
      <div className="mt-3 min-h-28 divide-y border-t border-border text-sm">
        {forecast.isPending ? <p className="py-4 text-muted-foreground">{t("products.forecast.loading", "กำลังโหลดคาดการณ์…")}</p> : forecast.isError ? <div className="flex items-center gap-3 py-4"><p>{t("products.forecast.loadFailed", "โหลดคาดการณ์ไม่สำเร็จ")}</p><Button size="sm" variant="outline" onClick={() => forecast.refetch()}>{t("actions.retry", "ลองใหม่", { ns: "common" })}</Button></div> : rows.length === 0 ? <p className="py-4 text-muted-foreground">{t("products.forecast.empty", "ยังไม่มีสินค้าในร้าน")}</p> : nearest.map((row) => <div key={row.listingId} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium">{row.listingName}</p><p className="text-xs text-muted-foreground">{t("products.forecast.rowSummary", "พร้อมขาย {available} ชิ้น · ขายสำเร็จ {sold} ชิ้นใน 30 วัน", { available: row.availableStock, sold: row.completedSales30Days })}</p></div><p className="text-xs font-medium">{result(row)}</p></div>)}
      </div>
    </section>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[min(620px,85vh)] flex-col gap-4 overflow-hidden rounded-xl sm:max-w-[calc(100vw-3rem)] xl:max-w-[1280px]">
        <div><DialogTitle className="text-lg font-bold">{t("products.forecast.dialogTitle", "คาดการณ์การเติมสต็อกทั้งหมด")}</DialogTitle><DialogDescription className="mt-1 text-xs">{t("products.forecast.dialogDescription", "ข้อมูลรายสินค้า · ยอดขายสำเร็จ 30 วันล่าสุด · คาดการณ์จากจำนวนพร้อมขาย")}</DialogDescription></div>
        <div className="flex flex-wrap gap-2"><Input aria-label={t("products.filter.search", "ค้นหาสินค้า")} placeholder={t("products.forecast.searchPlaceholder", "ค้นหาชื่อสินค้า…")} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full sm:w-80 lg:w-96" />{([["all", t("products.filter.all", "ทั้งหมด")], ["soon", t("products.forecast.filterSoon", "ใกล้หมดตามยอดขาย")], ["insufficient", t("products.forecast.filterInsufficient", "ข้อมูลไม่พอ")]] as const).map(([key, label]) => <Button key={key} size="sm" variant={filter === key ? "default" : "outline"} onClick={() => { setFilter(key); setPage(1); }}>{label}</Button>)}</div>
        <div aria-label={t("products.forecast.list", "รายการคาดการณ์สินค้า")} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">{forecast.isPending ? <p className="py-8 text-center text-muted-foreground">{t("products.forecast.loading", "กำลังโหลดคาดการณ์…")}</p> : forecast.isError ? <div className="py-8 text-center"><p>{t("products.forecast.loadFailed", "โหลดคาดการณ์ไม่สำเร็จ")}</p><Button className="mt-2" variant="outline" onClick={() => forecast.refetch()}>{t("actions.retry", "ลองใหม่", { ns: "common" })}</Button></div> : filtered.length === 0 ? <p className="py-8 text-center text-muted-foreground">{rows.length === 0 ? t("products.forecast.empty", "ยังไม่มีสินค้าในร้าน") : t("products.forecast.noMatch", "ไม่พบสินค้าที่ตรงกับการค้นหาหรือตัวกรอง")}</p> : <div className="space-y-1"><div className="sticky top-0 z-10 hidden grid-cols-[2fr_0.7fr_0.8fr_1.4fr_1.2fr] gap-2 rounded bg-muted px-3 py-2 text-xs text-muted-foreground lg:grid"><span>{t("products.table.product", "สินค้า")}</span><span>{t("products.table.available", "พร้อมขาย")}</span><span>{t("products.forecast.sold30", "ขายแล้ว 30 วัน")}</span><span>{t("products.forecast.estimateStatus", "คาดการณ์ / สถานะ")}</span><span>{t("products.forecast.actions", "การดำเนินการ")}</span></div>{visible.map((row) => <div key={row.listingId} className="grid min-h-20 gap-2 rounded border border-border px-3 py-3 text-xs lg:grid-cols-[2fr_0.7fr_0.8fr_1.4fr_1.2fr] lg:items-center"><span className="font-medium">{row.listingName}</span><span>{t("products.unit.pieces", "{count} ชิ้น", { count: row.availableStock })}</span><span>{t("products.unit.pieces", "{count} ชิ้น", { count: row.completedSales30Days })}</span><span>{result(row)}</span><span className="flex gap-1"><Link className="rounded-md border border-border px-2 py-1.5" to={`/listings/${row.listingId}`}>{t("products.forecast.viewProduct", "ดูสินค้า")}</Link><Link className="rounded-md bg-primary px-2 py-1.5 text-primary-foreground" to={`/seller/products/${row.listingId}/restock`}>{t("products.actions.restock", "เติมสต็อก")}</Link></span></div>)}</div>}</div>
        {!forecast.isPending && !forecast.isError && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {t("products.pagination.range", "แสดง {from}–{to} จาก {total} รายการ", { from: filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0, to: Math.min(currentPage * PAGE_SIZE, filtered.length), total: filtered.length })}
            </span>
            <nav aria-label={t("products.pagination.label", "เปลี่ยนหน้า")} className="flex flex-nowrap items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                className="h-9 rounded-xl border border-input px-3.5 text-xs text-foreground hover:bg-muted disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("actions.previous", "ก่อนหน้า", { ns: "common" })}
              </Button>
              {visiblePages.map((pageNum) => {
                const isActive = currentPage === pageNum;
                return (
                  <Button
                    key={pageNum}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "size-9 min-w-9 rounded-xl border text-xs font-medium transition-colors",
                      isActive
                        ? "border-teal-600 bg-teal-600 text-white hover:bg-teal-600/90 hover:text-white"
                        : "border-input bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= pages}
                onClick={() => setPage(Math.min(pages, currentPage + 1))}
                className="h-9 rounded-xl border border-input px-3.5 text-xs text-foreground hover:bg-muted disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("actions.next", "ถัดไป", { ns: "common" })}
              </Button>
            </nav>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </>;
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-555]
// @tolgee-key {"key": "products.forecast.outOfStock", "ns": "seller", "defaultValue": "หมดสต็อก"}
// @tolgee-key {"key": "products.forecast.noSales", "ns": "seller", "defaultValue": "ยังไม่มีการขาย"}
// @tolgee-key {"key": "products.forecast.insufficient", "ns": "seller", "defaultValue": "ข้อมูลยังไม่พอสำหรับคาดการณ์"}
// @tolgee-key {"key": "products.forecast.estimate", "ns": "seller", "defaultValue": "คาดว่าจะหมดใน ~{days} วัน · {date}"}
