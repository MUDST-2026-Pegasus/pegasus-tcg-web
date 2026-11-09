import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BadgePercent, Info, Plus, Search } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useAdminGames } from "../catalog.queries";
import { formatBaht } from "../promotions.format";
import { usePromotionCategories } from "../promotions.queries";
import { PROMOTION_PAGE_CONTROLS } from "../promotions.styles";
import { SALE_PAGE_SIZE, SALE_STATUS_TABS, SALE_TYPE_FILTERS, saleHasOrders, type SaleScopeNames } from "../sales.format";
import { useSaleCardSets, useSaleSummary, useSales } from "../sales.queries";
import type { AdminSale, SaleStatus, SaleType } from "../sales.types";
import { PromotionPageTabs } from "./PromotionPageTabs";
import { SaleActionDialog, type SaleActionState } from "./SaleActionDialog";
import { SaleTable, type SaleRowAction } from "./SaleTable";
import { intlLocale } from "@/lib/i18n";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * แท็บ "ลดราคาสินค้า" ของ /admin/promotions?tab=sales (Figma SAL-A1)
 * filter / แท็บสถานะ / หน้า อยู่ใน URL ทั้งหมด
 */
export function AdminSalesContent() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") as SaleStatus | null;
  const type = params.get("type") as SaleType | null;
  const q = params.get("q") ?? "";
  const page = Math.max(0, Number(params.get("page")) || 0);

  const [search, setSearch] = useState(q);
  const [action, setAction] = useState<SaleActionState | null>(null);
  const [now] = useState(() => Date.now());

  const list = useSales({
    status: status ?? undefined,
    type: type ?? undefined,
    q: q || undefined,
    page,
    size: SALE_PAGE_SIZE,
  });
  const summary = useSaleSummary();
  const games = useAdminGames();
  const categories = usePromotionCategories();
  const gameIds = useMemo(() => (games.data ?? []).map((game) => game.id), [games.data]);
  const rows = list.data?.page.items ?? [];
  const needsCardSets = rows.some((sale) => sale.scopeType === "CARD_SET");
  const cardSets = useSaleCardSets(gameIds, needsCardSets);

  const scopeNames = useMemo<SaleScopeNames>(
    () => ({
      games: new Map((games.data ?? []).map((game) => [game.id, game.name])),
      categories: new Map((categories.data ?? []).map((category) => [category.id, category.name])),
      cardSets: new Map((cardSets.data ?? []).map((set) => [set.id, set.code || set.name])),
    }),
    [games.data, categories.data, cardSets.data],
  );

  const updateParams = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    next.set("tab", "sales");
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetPage) next.delete("page");
    setParams(next);
  };

  useEffect(() => {
    if (search.trim() === q) return;
    const timer = window.setTimeout(() => updateParams({ q: search.trim() || null }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // updateParams อ่าน params ล่าสุดทุกครั้ง ไม่ต้องอยู่ใน deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, q]);

  const onRowAction = (kind: SaleRowAction, sale: AdminSale) => {
    // รู้อยู่แล้วว่ามีออเดอร์ ไม่ต้องให้กดยืนยันก่อนค่อยบอกว่าลบไม่ได้
    const blocked = kind === "delete" && saleHasOrders(sale);
    setAction({ kind: blocked ? "blocked" : kind, sale });
  };

  const totalItems = list.data?.page.totalItems ?? 0;
  const totalPages = Math.max(1, list.data?.page.totalPages ?? 1);
  const counts = list.data?.statusCounts;
  const firstPage = Math.max(0, Math.min(page - 1, totalPages - 3));
  const pageNumbers = Array.from({ length: Math.min(3, totalPages) }, (_, index) => firstPage + index);
  const s = summary.data;

  return (
    <main className={cn("grid w-full min-w-0 gap-6", PROMOTION_PAGE_CONTROLS)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-black">โปรโมชั่น &amp; ลดราคา</h1>
          <p className="text-sm text-muted-foreground">
            ตั้งราคาลดให้สินค้าโดยตรง ผู้ซื้อเห็นราคาที่ลดแล้วทันทีโดยไม่ต้องใช้โค้ด · Flash Sale / ลดทั้งหมวด /
            ดูแลการลดราคาของร้าน
          </p>
        </div>
        <Button size="sm" className="px-3" render={<Link to="/admin/sales/new" />} nativeButton={false}>
          <Plus />
          สร้างแคมเปญลดราคา
        </Button>
      </header>

      <PromotionPageTabs value="sales" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="กำลังลดราคา"
          value={((s?.activePlatformSales ?? 0) + (s?.activeSellerSales ?? 0)).toLocaleString(intlLocale())}
          note={`Pegasus ${s?.activePlatformSales ?? 0} · ร้านค้า ${s?.activeSellerSales ?? 0}`}
        />
        <KpiCard
          label="Listing ที่ลดอยู่ตอนนี้"
          value={(s?.listingsOnSale ?? 0).toLocaleString(intlLocale())}
          note="ทั้งแคมเปญ Pegasus และร้านลดเอง"
        />
        <KpiCard
          label="ยอดขายจากราคาลด (30 วัน)"
          value={formatBaht(s?.saleSales30d)}
          note="ยอดที่ผู้ซื้อจ่ายในออเดอร์ที่ชำระแล้ว"
        />
        <KpiCard
          label="Pegasus อุดหนุน (30 วัน)"
          value={formatBaht(s?.saleSubsidy30d)}
          note="SALE_SUBSIDY · แยกจากต้นทุนโค้ด"
        />
      </div>

      <Card className="gap-0 overflow-hidden rounded-[12px] border border-border p-0 shadow-none ring-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              className="w-fit max-w-full"
              value={status ?? "ALL"}
              onValueChange={(value) => updateParams({ status: value === "ALL" ? null : String(value) })}
            >
              <TabsList aria-label="กรองตามสถานะ" className="h-auto max-w-full gap-1 overflow-x-auto rounded-md bg-[#eef1f2] p-[3px]">
                {SALE_STATUS_TABS.map((tab) => {
                  const count =
                    tab.value == null
                      ? Object.values(counts ?? {}).reduce((sum, value) => sum + (value ?? 0), 0)
                      : (counts?.[tab.value] ?? 0);
                  return (
                    <TabsTrigger
                      key={tab.label}
                      value={tab.value ?? "ALL"}
                      className="h-auto gap-1.5 rounded-sm border-0! px-2.5 py-1.5 text-[13px] text-muted-foreground data-active:font-semibold data-active:shadow-xs"
                    >
                      {tab.label}
                      <span className="text-[11px] font-semibold text-[#9aa5ad]">{count}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            <div role="group" aria-label="ประเภทการลดราคา" className="flex overflow-hidden rounded-sm border">
              {SALE_TYPE_FILTERS.map((filter) => (
                <Button
                  key={filter.label}
                  size="sm"
                  variant="ghost"
                  className="rounded-none! px-3 text-[13px] text-[#414755] aria-pressed:bg-[#f0f7fc] aria-pressed:text-[#0058bc]"
                  aria-pressed={type === filter.value}
                  onClick={() => updateParams({ type: filter.value })}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
          <form
            role="search"
            className="w-[200px] max-w-full"
            onSubmit={(event) => {
              event.preventDefault();
              updateParams({ q: search.trim() || null });
            }}
          >
            <InputGroup className="h-[34px] text-[13px]">
              <InputGroupAddon>
                <Search aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                className="text-[13px] md:text-[13px]"
                aria-label="ค้นหาแคมเปญ"
                placeholder="ค้นหาแคมเปญ / ร้าน"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>
          </form>
        </div>

        {list.isPending ? <p className="p-6 text-sm text-muted-foreground">กำลังโหลดแคมเปญ...</p> : null}
        {list.isError ? (
          <p role="alert" className="p-6 text-sm text-destructive">
            โหลดแคมเปญไม่สำเร็จ{" "}
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void list.refetch()}>
              ลองอีกครั้ง
            </Button>
          </p>
        ) : null}
        {list.data && rows.length === 0 ? (
          <Empty className="m-5 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BadgePercent />
              </EmptyMedia>
              <EmptyTitle>ยังไม่มีแคมเปญในแท็บนี้</EmptyTitle>
              <EmptyDescription>สร้าง Flash Sale หรือแคมเปญลดทั้งหมวด ผู้ซื้อเห็นราคาลดทันทีโดยไม่ต้องใช้โค้ด</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" render={<Link to="/admin/sales/new" />} nativeButton={false}>
                <Plus />
                สร้างแคมเปญลดราคา
              </Button>
            </EmptyContent>
          </Empty>
        ) : null}
        {rows.length > 0 ? <SaleTable sales={rows} scopeNames={scopeNames} now={now} onAction={onRowAction} /> : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-3 text-[13px] text-muted-foreground">
          <span>
            แสดง {rows.length ? page * SALE_PAGE_SIZE + 1 : 0}–{page * SALE_PAGE_SIZE + rows.length} จาก {totalItems}{" "}
            แคมเปญ
          </span>
          {totalPages > 1 ? (
            <nav aria-label="หน้ารายการแคมเปญลดราคา" className="flex items-center gap-2">
              <Button
                size="icon-sm"
                className="size-7 text-[13px] text-[#414755]"
                variant="outline"
                aria-label="หน้าก่อนหน้า"
                disabled={page === 0}
                onClick={() => updateParams({ page: String(page - 1) }, false)}
              >
                ‹
              </Button>
              {pageNumbers.map((number) => (
                <Button
                  key={number}
                  size="icon-sm"
                  className="h-7 w-auto min-w-7 px-2.5 text-[13px]"
                  variant={number === page ? "default" : "outline"}
                  aria-current={number === page ? "page" : undefined}
                  aria-label={`หน้า ${number + 1}`}
                  onClick={() => updateParams({ page: number ? String(number) : null }, false)}
                >
                  {number + 1}
                </Button>
              ))}
              <Button
                size="icon-sm"
                className="size-7 text-[13px] text-[#414755]"
                variant="outline"
                aria-label="หน้าถัดไป"
                disabled={page + 1 >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) }, false)}
              >
                ›
              </Button>
            </nav>
          ) : null}
        </div>
      </Card>

      <Alert className="rounded-[12px] border-[#fde4bd] bg-[#fff1db] px-4 py-3.5 text-[#956019]">
        <Info />
        <AlertDescription className="text-[13px] text-[#956019]">
          แคมเปญ Pegasus: ร้านได้เงินเต็มราคาตั้งต้น Pegasus อุดหนุนส่วนลดตอนปล่อย escrow (SALE_SUBSIDY) · ยอดจองถึงงบ →
          แคมเปญจบเอง (หมดงบ) · การลดราคาของร้าน: ร้านออกเงินเอง แอดมินแก้ไม่ได้ แต่หยุดได้พร้อมเหตุผล · 1 listing
          ใช้ราคาลดได้ทีละรายการ (ราคาต่ำสุดชนะ) และยังใช้โค้ดส่วนลดซ้อนได้
        </AlertDescription>
      </Alert>

      <SaleActionDialog action={action} onChange={setAction} />
    </main>
  );
}

function KpiCard({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "up" | "down" }) {
  return (
    <Card className="min-w-0 gap-1.5 rounded-[12px] border border-border px-5 py-4 shadow-none ring-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl leading-tight font-black">{value}</p>
      <p
        className={cn(
          "text-xs text-muted-foreground",
          tone === "up" && "text-[#007a4a]",
          tone === "down" && "text-destructive",
        )}
      >
        {note}
      </p>
    </Card>
  );
}
