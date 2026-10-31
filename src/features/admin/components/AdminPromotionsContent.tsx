import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, Info, Plus, Search, TicketPercent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { useAdminGames } from "../catalog.queries";
import {
  PROMOTION_PAGE_SIZE,
  STATUS_TABS,
  type ScopeNames,
  currentHomeIds,
  formatBaht,
  percentOf,
} from "../promotions.format";
import {
  usePlatformPromotions,
  usePromotionCategories,
  usePromotionSummary,
  usePromotions,
} from "../promotions.queries";
import type { AdminPromotion, PromotionOwnerType, PromotionStatus } from "../promotions.types";
import { PromotionActionDialog, type PromotionActionState } from "./PromotionActionDialog";
import { PromotionHomeOrderDialog } from "./PromotionHomeOrderDialog";
import { PromotionRedemptionSheet } from "./PromotionRedemptionSheet";
import { PromotionTable, type PromotionRowAction } from "./PromotionTable";
import "./promotions.css";

const OWNER_FILTERS: Array<{ value: PromotionOwnerType | null; label: string }> = [
  { value: null, label: "ทุกเจ้าของ" },
  { value: "PLATFORM", label: "Pegasus" },
  { value: "SELLER", label: "ร้านค้า" },
];

const SEARCH_DEBOUNCE_MS = 300;

/** หน้า /admin/promotions (Figma PRM-A1) — filter แท็บ หน้า และ sheet อยู่ใน URL ทั้งหมด */
export function AdminPromotionsContent() {
  const [params, setParams] = useSearchParams();
  const owner = params.get("owner") as PromotionOwnerType | null;
  const status = params.get("status") as PromotionStatus | null;
  const q = params.get("q") ?? "";
  const page = Math.max(0, Number(params.get("page")) || 0);
  const promoId = Number(params.get("promo")) || 0;
  const redemptionPage = Math.max(0, Number(params.get("redemptionPage")) || 0);

  const [search, setSearch] = useState(q);
  const [action, setAction] = useState<PromotionActionState | null>(null);
  const [homeOpen, setHomeOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const list = usePromotions({
    owner: owner ?? undefined,
    status: status ?? undefined,
    q: q || undefined,
    page,
    size: PROMOTION_PAGE_SIZE,
  });
  const summary = usePromotionSummary();
  const platform = usePlatformPromotions();
  const games = useAdminGames();
  const categories = usePromotionCategories();

  const scopeNames = useMemo<ScopeNames>(
    () => ({
      games: new Map((games.data ?? []).map((game) => [game.id, game.name])),
      categories: new Map((categories.data ?? []).map((category) => [category.id, category.name])),
    }),
    [games.data, categories.data],
  );
  const homeIds = useMemo(() => currentHomeIds(platform.data ?? []), [platform.data]);

  const updateParams = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
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

  const onRowAction = (kind: PromotionRowAction, promotion: AdminPromotion) => {
    if (kind === "copy") {
      void navigator.clipboard
        ?.writeText(promotion.code)
        .then(() => toast.add({ title: `คัดลอก ${promotion.code} แล้ว`, type: "success" }));
      return;
    }
    if (kind === "redemptions") {
      updateParams({ promo: String(promotion.id), redemptionPage: null }, false);
      return;
    }
    // รู้อยู่แล้วว่ามีคนเก็บ/ใช้ ไม่ต้องให้พิมพ์ยืนยันก่อนค่อยบอกว่าลบไม่ได้
    const blocked = kind === "delete" && (promotion.usedCount > 0 || promotion.claimedCount > 0);
    setAction({ kind: blocked ? "blocked" : kind, promotion });
  };

  const rows = list.data?.page.items ?? [];
  const totalItems = list.data?.page.totalItems ?? 0;
  const totalPages = Math.max(1, list.data?.page.totalPages ?? 1);
  const counts = list.data?.statusCounts;
  const firstPage = Math.max(0, Math.min(page - 1, totalPages - 3));
  const pageNumbers = Array.from({ length: Math.min(3, totalPages) }, (_, index) => firstPage + index);
  const change = summary.data?.redemptionsChangePercent;
  const costShare = summary.data ? percentOf(summary.data.platformDiscountCost30d, summary.data.gmv30d) : null;
  const orderShare = summary.data ? percentOf(summary.data.ordersWithCodes30d, summary.data.paidOrders30d) : null;

  return (
    <main className="promotion-admin promotion-list-page grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">โปรโมชั่น &amp; โค้ดส่วนลด</h1>
          <p className="text-sm text-muted-foreground">สร้างโค้ดที่ Pegasus ออกเงิน และดูแลโค้ดที่ร้านค้าสร้างเอง</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!platform.data} onClick={() => setHomeOpen(true)}>
            <ArrowUpDown />
            จัดลำดับหน้าแรก
          </Button>
          <Button render={<Link to="/admin/promotions/new" />} nativeButton={false}>
            <Plus />
            สร้างโค้ด Pegasus
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="โค้ดที่ใช้งานอยู่"
          value={((summary.data?.activePlatformCodes ?? 0) + (summary.data?.activeSellerCodes ?? 0)).toLocaleString("th-TH")}
          caption={`Pegasus ${summary.data?.activePlatformCodes ?? 0} · ร้านค้า ${summary.data?.activeSellerCodes ?? 0}`}
        />
        <KpiCard
          label="ใช้โค้ด (30 วัน)"
          value={(summary.data?.redemptions30d ?? 0).toLocaleString("th-TH")}
          caption={change == null ? "ยังไม่มีข้อมูลเดือนก่อน" : `${change > 0 ? "+" : ""}${change}% จากเดือนก่อน`}
          captionClassName={change == null ? undefined : change >= 0 ? "text-[#007a4a]" : "text-destructive"}
        />
        <KpiCard
          label="ต้นทุนส่วนลดที่ Pegasus ออก (30 วัน)"
          value={formatBaht(summary.data?.platformDiscountCost30d)}
          caption={costShare ? `${costShare} ของ GMV` : "ยังไม่มียอดขายใน 30 วัน"}
        />
        <KpiCard
          label="ยอดขายจากออเดอร์ที่ใช้โค้ด"
          value={formatBaht(summary.data?.salesWithCodes30d)}
          caption={orderShare ? `${orderShare} ของออเดอร์ทั้งหมด` : "ยังไม่มียอดขายใน 30 วัน"}
        />
      </div>

      <Card className="gap-0 overflow-hidden rounded-xl p-0 shadow-none">
        <div className="promotion-list-toolbar border-b">
          <div className="promotion-status-tabs" role="tablist" aria-label="กรองตามสถานะ">
            {STATUS_TABS.map((tab) => {
              const selected = status === tab.value;
              const count =
                tab.value == null
                  ? Object.values(counts ?? {}).reduce((sum, value) => sum + value, 0)
                  : (counts?.[tab.value] ?? 0);
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => updateParams({ status: tab.value })}
                  className={cn("promotion-status-tab", selected && "is-selected")}
                >
                  <span>{tab.label}</span>
                  <span className="promotion-tab-count">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="promotion-list-controls">
            <div className="promotion-owner-tabs" role="group" aria-label="เจ้าของโค้ด">
              {OWNER_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  aria-pressed={owner === filter.value}
                  onClick={() => updateParams({ owner: filter.value })}
                  className={cn(owner === filter.value && "is-selected")}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <form
              className="promotion-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                updateParams({ q: search.trim() || null });
              }}
            >
              <Search aria-hidden />
              <Input
                aria-label="ค้นหาโค้ด"
                placeholder="ค้นหาโค้ด / แคมเปญ / ร้าน"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </form>
          </div>
        </div>

        {list.isPending ? <p className="p-6 text-sm text-muted-foreground">กำลังโหลดโค้ด...</p> : null}
        {list.isError ? (
          <p role="alert" className="p-6 text-sm text-destructive">
            โหลดโค้ดไม่สำเร็จ{" "}
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void list.refetch()}>
              ลองอีกครั้ง
            </Button>
          </p>
        ) : null}
        {list.data && rows.length === 0 ? (
          <div className="m-5 grid justify-items-center gap-2 rounded-xl border border-dashed p-10 text-center">
            <TicketPercent className="size-8 text-muted-foreground" aria-hidden />
            <strong className="text-sm">ยังไม่มีโค้ดในแท็บนี้</strong>
            <p className="text-xs text-muted-foreground">สร้างโค้ด Pegasus เพื่อกระตุ้นยอดขายช่วงแคมเปญ</p>
            <Button size="sm" render={<Link to="/admin/promotions/new" />} nativeButton={false}>
              <Plus />
              สร้างโค้ด Pegasus
            </Button>
          </div>
        ) : null}
        {rows.length > 0 ? (
          <PromotionTable
            promotions={rows}
            scopeNames={scopeNames}
            now={now}
            onAction={onRowAction}
          />
        ) : null}

        <div className="promotion-pagination border-t">
          <span>
            แสดง {rows.length ? page * PROMOTION_PAGE_SIZE + 1 : 0}–{page * PROMOTION_PAGE_SIZE + rows.length} จาก{" "}
            {totalItems} โค้ด
          </span>
          <nav aria-label="หน้ารายการโปรโมชั่น" className="promotion-page-buttons">
            <Button
              size="icon-sm"
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
              variant="outline"
              aria-label="หน้าถัดไป"
              disabled={page + 1 >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) }, false)}
            >
              ›
            </Button>
          </nav>
        </div>
      </Card>

      <p className="promotion-admin-note">
        <Info aria-hidden />
        <span>
          โค้ดร้านค้า: ร้านเป็นผู้ออกเงินส่วนลดเอง แอดมินแก้ไขไม่ได้ แต่ “หยุดชั่วคราว” ได้พร้อมระบุเหตุผล
          (ร้านจะเห็นเหตุผลนั้น) · โค้ด Pegasus: ร้านได้เงินเต็ม Pegasus อุดหนุนส่วนต่างตอนปล่อย escrow
        </span>
      </p>

      <PromotionActionDialog action={action} homeIds={homeIds} now={now} onChange={setAction} />
      <PromotionHomeOrderDialog open={homeOpen} onOpenChange={setHomeOpen} promotions={platform.data ?? []} />
      <PromotionRedemptionSheet
        promotionId={promoId}
        page={redemptionPage}
        onPageChange={(next) => updateParams({ redemptionPage: next ? String(next) : null }, false)}
        onClose={() => updateParams({ promo: null, redemptionPage: null }, false)}
      />
    </main>
  );
}

function KpiCard({
  label,
  value,
  caption,
  captionClassName,
}: {
  label: string;
  value: string;
  caption: string;
  captionClassName?: string;
}) {
  return (
    <Card className="gap-1 rounded-xl p-5 shadow-none">
      <span className="text-xs text-muted-foreground">{label}</span>
      <strong className="text-2xl">{value}</strong>
      <span className={cn("text-xs text-muted-foreground", captionClassName)}>{caption}</span>
    </Card>
  );
}
