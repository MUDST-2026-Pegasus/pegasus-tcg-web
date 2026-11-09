import { useEffect, useState } from "react";
import { Gavel, Info, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clockOffset, formatBaht } from "@/features/auction/auction.format";
import { useSellerAuctions } from "@/features/auction/auction.queries";
import type { AuctionStatus, SellerAuctionPage, SellerAuctionRow } from "@/features/auction/auction.types";
import { ProductPagination } from "@/features/seller/products/components/ProductPagination";
import { ProductTableSkeleton } from "@/features/seller/products/components/ProductTableSkeleton";
import { cn } from "@/lib/utils";

import { SELLER_AUCTION_TABS, formatPercentChange, hoursUntil, totalAuctionCount } from "./auctions-table.format";
import { AuctionsTable } from "./components/AuctionsTable";
import { CancelAuctionDialog } from "./components/CancelAuctionDialog";
import { intlLocale } from "@/lib/i18n";

const PAGE_SIZE = 20;

function readStatus(value: string | null): AuctionStatus | undefined {
  return SELLER_AUCTION_TABS.find((tab) => tab.status === value)?.status ?? undefined;
}

/** หน้าใน URL เริ่มที่ 1 — backend เริ่มที่ 0 */
function readPage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/**
 * `/seller/auctions` — การประมูลของร้าน (Figma S1) [TCG-632 · FE-6]
 * สถานะ คำค้น และเลขหน้าอยู่ใน URL (`?status=LIVE&q=charizard&page=2`)
 */
export function SellerAuctionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = readStatus(searchParams.get("status"));
  const search = searchParams.get("q")?.trim() ?? "";
  const page = readPage(searchParams.get("page"));
  const auctions = useSellerAuctions({ status, q: search || undefined, page: page - 1, size: PAGE_SIZE });

  const [cancelTarget, setCancelTarget] = useState<SellerAuctionRow | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  function updateParams(changes: { status?: AuctionStatus | null; q?: string; page?: number }) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (changes.status !== undefined) {
          if (changes.status === null) next.delete("status");
          else next.set("status", changes.status);
          next.delete("page");
        }
        if (changes.q !== undefined) {
          const q = changes.q.trim();
          if (q === (current.get("q")?.trim() ?? "")) return current;
          if (q === "") next.delete("q");
          else next.set("q", q);
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
  // ร้านยังไม่เคยเปิดประมูลเลย → empty state ของ S1 แทนทั้งตาราง
  const neverOpened = data !== undefined && totalAuctionCount(data.statusCounts) === 0 && !search;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">การประมูลของฉัน</h1>
          <p className="text-xs text-muted-foreground">เปิดประมูลการ์ดจากสต็อกของคุณ ผู้ซื้อที่บิดสูงสุดเมื่อหมดเวลาได้การ์ดไป</p>
        </div>
        <NewAuctionButton />
      </div>

      {data ? <KpiCards data={data} /> : null}

      <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        การ์ดที่นำมาประมูลจะถูกล็อก ไม่ขายในหน้าร้านจนกว่าประมูลจะจบ · ยกเลิกได้เฉพาะตอนยังไม่มีบิด · ไม่มีผู้บิดหรือผู้ชนะไม่ชำระ การ์ดกลับเข้าสต็อกอัตโนมัติ · ค่าคอมมิชชั่นเท่าการขายปกติ
      </p>

      {neverOpened ? (
        <EmptyState icon={Gavel} title="เปิดประมูลแรกของร้านคุณ" description="เลือกการ์ดจากสต็อก ตั้งราคาเริ่มต้นและเวลา ผู้ซื้อจะบิดสู้กันเอง">
          <NewAuctionButton />
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="สถานะการประมูล" className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
              {SELLER_AUCTION_TABS.map((tab) => {
                const active = (status ?? null) === tab.status;
                const count = data ? (tab.status ? data.statusCounts[tab.status] : totalAuctionCount(data.statusCounts)) : null;
                return (
                  <button
                    key={tab.label}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => updateParams({ status: tab.status })}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                      active ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    {count !== null ? <span className="text-muted-foreground">{count}</span> : null}
                  </button>
                );
              })}
            </div>
            <SearchBox value={search} onChange={(q) => updateParams({ q })} />
          </div>

          <QueryBoundary query={auctions} loading={<ProductTableSkeleton />} errorTitle="โหลดรายการประมูลไม่สำเร็จ">
            {(result) => (
              <AuctionsTable
                rows={result.page.items}
                serverTime={result.serverTime}
                isFetching={auctions.isPlaceholderData}
                onCancel={(row) => {
                  setCancelTarget(row);
                  setCancelOpen(true);
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
        </>
      )}

      <CancelAuctionDialog row={cancelTarget} open={cancelOpen} onOpenChange={setCancelOpen} />
    </div>
  );
}

function NewAuctionButton() {
  return (
    <Button className="rounded-lg px-4" nativeButton={false} render={<Link to="/seller/auctions/new" />}>
      + เปิดประมูลใหม่
    </Button>
  );
}

/** 4 การ์ดตัวเลขบนหัวหน้า S1 */
function KpiCards({ data }: { data: SellerAuctionPage }) {
  const { kpis } = data;
  const offset = clockOffset(data.serverTime);
  const percentTone =
    kpis.closeVsMarketPercent === null ? "text-foreground" : kpis.closeVsMarketPercent >= 0 ? "text-emerald-700" : "text-red-700";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi label="กำลังประมูล" value={kpis.liveCount.toLocaleString(intlLocale())} note={`มีบิดแล้ว ${kpis.liveWithBids} รายการ`} />
      <Kpi
        label="รอผู้ชนะชำระเงิน"
        value={kpis.awaitingPaymentCount.toLocaleString(intlLocale())}
        valueClass="text-amber-800"
        note={kpis.nextPaymentDueAt ? `ครบกำหนดใน ${hoursUntil(kpis.nextPaymentDueAt, offset)} ชม.` : null}
      />
      <Kpi label="ขายผ่านประมูล (30 วัน)" value={formatBaht(kpis.soldLast30Days)} note={`จาก ${kpis.closedLast30Days} รายการ`} />
      <Kpi label="ราคาปิดเทียบราคาตลาด" value={formatPercentChange(kpis.closeVsMarketPercent)} valueClass={percentTone} note="เฉลี่ย 30 วันล่าสุด" />
    </div>
  );
}

function Kpi({ label, value, note, valueClass }: { label: string; value: string; note: string | null; valueClass?: string }) {
  return (
    <Card className="gap-1 rounded-xl p-4 shadow-none">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums text-foreground", valueClass)}>{value}</p>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </Card>
  );
}

/** ช่องค้นหา — ส่งค่าเมื่อหยุดพิมพ์ 300ms */
function SearchBox({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  // URL เปลี่ยนจากที่อื่น (กด back) → ตามค่าใหม่
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }

  useEffect(() => {
    // คำเดิมกับใน URL = ไม่ต้องส่ง (กันวนเปลี่ยน URL ซ้ำทุกครั้งที่ render)
    if (text.trim() === value.trim()) return;
    const timer = setTimeout(() => onChange(text), 300);
    return () => clearTimeout(timer);
  }, [text, value, onChange]);

  return (
    <div className="relative w-full sm:w-56">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="ค้นหาการ์ด"
        placeholder="ค้นหาการ์ด…"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="h-9 rounded-lg bg-card pl-9 text-sm"
      />
    </div>
  );
}
