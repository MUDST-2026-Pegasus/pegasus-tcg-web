import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: Math.max(1, totalPages) }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }
  if (currentPage >= totalPages - 2) {
    return [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ];
}

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
  if (row.status === "OUT_OF_STOCK") return "หมดสต็อก";
  if (row.status === "NO_SALES") return "ยังไม่มีการขาย";
  if (row.daysRemaining == null || !row.estimatedStockoutDate) return "ข้อมูลยังไม่พอสำหรับคาดการณ์";
  return `คาดว่าจะหมดใน ~${row.daysRemaining} วัน · ${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(row.estimatedStockoutDate))}`;
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
    <section aria-label="คาดการณ์การเติมสต็อก" className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-bold text-foreground">คาดการณ์การเติมสต็อก</h2><p className="mt-1 text-xs text-muted-foreground">แสดง 2 รายการที่คาดว่าจะหมดเร็วที่สุด · อิงยอดขายสำเร็จ 30 วันล่าสุด</p></div>
        <Button variant="outline" size="sm" onClick={() => { void forecast.refetch(); setOpen(true); }}>ดูทั้งหมด</Button>
      </div>
      <div className="mt-3 min-h-28 divide-y border-t border-border text-sm">
        {forecast.isPending ? <p className="py-4 text-muted-foreground">กำลังโหลดคาดการณ์…</p> : forecast.isError ? <div className="flex items-center gap-3 py-4"><p>โหลดคาดการณ์ไม่สำเร็จ</p><Button size="sm" variant="outline" onClick={() => forecast.refetch()}>ลองใหม่</Button></div> : rows.length === 0 ? <p className="py-4 text-muted-foreground">ยังไม่มีสินค้าในร้าน</p> : nearest.map((row) => <div key={row.listingId} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium">{row.listingName}</p><p className="text-xs text-muted-foreground">พร้อมขาย {row.availableStock} ชิ้น · ขายสำเร็จ {row.completedSales30Days} ชิ้นใน 30 วัน</p></div><p className="text-xs font-medium">{result(row)}</p></div>)}
      </div>
    </section>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[min(620px,85vh)] flex-col gap-4 overflow-hidden rounded-xl sm:max-w-[calc(100vw-3rem)] xl:max-w-[1280px]">
        <div><DialogTitle className="text-lg font-bold">คาดการณ์การเติมสต็อกทั้งหมด</DialogTitle><DialogDescription className="mt-1 text-xs">ข้อมูลรายสินค้า · ยอดขายสำเร็จ 30 วันล่าสุด · คาดการณ์จากจำนวนพร้อมขาย</DialogDescription></div>
        <div className="flex flex-wrap gap-2"><Input aria-label="ค้นหาสินค้า" placeholder="ค้นหาชื่อสินค้า…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full sm:w-80 lg:w-96" />{([["all", "ทั้งหมด"], ["soon", "ใกล้หมดตามยอดขาย"], ["insufficient", "ข้อมูลไม่พอ"]] as const).map(([key, label]) => <Button key={key} size="sm" variant={filter === key ? "default" : "outline"} onClick={() => { setFilter(key); setPage(1); }}>{label}</Button>)}</div>
        <div aria-label="รายการคาดการณ์สินค้า" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">{forecast.isPending ? <p className="py-8 text-center text-muted-foreground">กำลังโหลดคาดการณ์…</p> : forecast.isError ? <div className="py-8 text-center"><p>โหลดคาดการณ์ไม่สำเร็จ</p><Button className="mt-2" variant="outline" onClick={() => forecast.refetch()}>ลองใหม่</Button></div> : filtered.length === 0 ? <p className="py-8 text-center text-muted-foreground">{rows.length === 0 ? "ยังไม่มีสินค้าในร้าน" : "ไม่พบสินค้าที่ตรงกับการค้นหาหรือตัวกรอง"}</p> : <div className="space-y-1"><div className="sticky top-0 z-10 hidden grid-cols-[2fr_0.7fr_0.8fr_1.4fr_1.2fr] gap-2 rounded bg-muted px-3 py-2 text-xs text-muted-foreground lg:grid"><span>สินค้า</span><span>พร้อมขาย</span><span>ขายแล้ว 30 วัน</span><span>คาดการณ์ / สถานะ</span><span>การดำเนินการ</span></div>{visible.map((row) => <div key={row.listingId} className="grid min-h-20 gap-2 rounded border border-border px-3 py-3 text-xs lg:grid-cols-[2fr_0.7fr_0.8fr_1.4fr_1.2fr] lg:items-center"><span className="font-medium">{row.listingName}</span><span>{row.availableStock} ชิ้น</span><span>{row.completedSales30Days} ชิ้น</span><span>{result(row)}</span><span className="flex gap-1"><Link className="rounded-md border border-border px-2 py-1.5" to={`/listings/${row.listingId}`}>ดูสินค้า</Link><Link className="rounded-md bg-primary px-2 py-1.5 text-primary-foreground" to={`/seller/products/${row.listingId}/restock`}>เติมสต็อก</Link></span></div>)}</div>}</div>
        {!forecast.isPending && !forecast.isError && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              แสดง {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
            </span>
            <nav aria-label="เปลี่ยนหน้า" className="flex flex-nowrap items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                className="h-9 rounded-xl border border-input px-3.5 text-xs text-foreground hover:bg-muted disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
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
                ถัดไป
              </Button>
            </nav>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </>;
}

