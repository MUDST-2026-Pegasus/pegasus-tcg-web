import { useEffect, useEffectEvent, useState, type MouseEvent } from "react";
import { Gavel, Info, SearchIcon, SearchX } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState } from "@/components/common";
import { ItemGridSkeleton } from "@/components/common/PageSkeletons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGameList } from "@/features/catalog/catalog.queries";
import { pageWindow } from "@/features/catalog/search.params";
import { cn } from "@/lib/utils";

import { useAuctions } from "../auction.queries";
import type { AuctionFilter, AuctionPage, AuctionSort } from "../auction.types";
import { AuctionCard } from "../components/AuctionCard";
import {
  AUCTION_SORTS,
  AUCTION_TABS,
  hasActiveAuctionFilters,
  readAuctionFilters,
  toAuctionQuery,
  writeAuctionFilters,
  type AuctionSearchFilters,
} from "../search.params";
import { intlLocale, localName, useTranslate } from "@/lib/i18n";

const TYPING_DELAY_MS = 300;
const ALL_GAMES = "__all__";

/** `/auctions` — หน้ารวมการประมูล ตาม Figma B1 (2286:7677) และ empty state (2310:8527) [TCG-628] */
export function AuctionListPage() {
  const { t } = useTranslate("auction");
  const [params, setParams] = useSearchParams();
  const filters = readAuctionFilters(params);

  const games = useGameList();
  const { query, ready } = toAuctionQuery(filters, games.data);
  const auctions = useAuctions(query, { enabled: ready });

  /** เปลี่ยนตัวกรองอะไรก็กลับไปหน้า 1 */
  const update = (patch: Partial<AuctionSearchFilters>, options?: { replace?: boolean }) => {
    setParams((current) => writeAuctionFilters({ ...readAuctionFilters(current), page: 1, ...patch }), options);
  };

  // ช่องค้นหาพิมพ์ได้ทันที แต่เขียนลง URL หลังหยุดพิมพ์ (แบบเดียวกับหน้าค้นหาสินค้า)
  const [searchInput, setSearchInput] = useState(filters.q);
  const [lastUrlQuery, setLastUrlQuery] = useState(filters.q);
  if (filters.q !== lastUrlQuery) {
    // q เปลี่ยนจากข้างนอก เช่น กด back หรือ "ล้างตัวกรอง"
    setLastUrlQuery(filters.q);
    setSearchInput(filters.q);
  }
  const commitQuery = useEffectEvent((next: string) => update({ q: next }, { replace: true }));
  useEffect(() => {
    const next = searchInput.trim();
    if (next === filters.q) return;
    const timer = window.setTimeout(() => commitQuery(next), TYPING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, filters.q]);

  const clearFilters = () =>
    setParams((current) => writeAuctionFilters({ ...readAuctionFilters(new URLSearchParams()), sort: readAuctionFilters(current).sort }));

  const goToPage = (page: number) => (event: MouseEvent) => {
    event.preventDefault();
    setParams((current) => writeAuctionFilters({ ...readAuctionFilters(current), page }));
    window.scrollTo({ top: 0 });
  };
  const pageHref = (page: number) => `?${writeAuctionFilters({ ...filters, page })}`;

  const data = auctions.data;
  const gameItems = [
    { value: ALL_GAMES, label: t("buyer.auctionListPage.label", "เกม: ทั้งหมด") },
    ...(games.data ?? []).map((game) => ({ value: game.slug, label: t("buyer.auctionListPage.label2", "เกม: {value}", { value: localName(game) }) })),
  ];

  return (
    <div className="min-h-[783px] bg-muted font-sans">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-[21px] pt-8 pb-14 xl:px-[64px]">
        <Breadcrumb>
          <BreadcrumbList className="text-[12px]">
            <BreadcrumbItem><BreadcrumbLink render={<Link to="/" />}>{t("breadcrumb.home", "หน้าแรก")}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{t("buyer.auctionListPage.text", "ประมูล")}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-sky-700">
              <Gavel aria-hidden className="size-3.5" />
              AUCTION
            </span>
            <h1 className="text-3xl font-bold text-foreground">{t("buyer.auctionListPage.text2", "ประมูลการ์ด")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("buyer.auctionListPage.text3", "ผู้ขายเปิดประมูล ผู้ซื้อบิดราคาสู้กัน — ผู้บิดสูงสุดเมื่อหมดเวลาได้การ์ดไป")}
            </p>
          </div>
          <Button variant="outline" className="h-10 w-fit rounded-full bg-background px-4" nativeButton={false} render={<Link to="/account/auctions" />}>
            <Gavel aria-hidden />
            {t("buyer.auctionListPage.text4", "การประมูลของฉัน")}
          </Button>
        </header>

        <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {t("buyer.auctionListPage.text5", "บิดแล้วถอนไม่ได้ · มีคนบิดใน 2 นาทีสุดท้าย เวลาจะต่อเป็น 2 นาที · ชนะแล้วชำระภายใน 24 ชม. · ปุ่ม \"ซื้อทันที\" ใช้ได้จนกว่าจะมีบิดแรก")}
          </span>
        </p>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label={t("buyer.auctionListPage.ariaLabel", "ตัวกรองประมูล")} className="flex flex-wrap gap-2 xl:flex-nowrap">
            {AUCTION_TABS.map((tab) => (
              <FilterTab
                key={tab.value ?? "ALL"}
                label={tab.label}
                count={countFor(data, tab.value)}
                selected={filters.tab === tab.value}
                onSelect={() => update({ tab: tab.value })}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-48">
              <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("buyer.auctionListPage.placeholder", "ค้นหาการ์ดที่ประมูล…")}
                aria-label={t("buyer.auctionListPage.ariaLabel2", "ค้นหาการ์ดที่ประมูล")}
                className="h-9 rounded-lg bg-background pl-9"
              />
            </div>
            <Select
              value={filters.game ?? ALL_GAMES}
              onValueChange={(value) => update({ game: !value || value === ALL_GAMES ? null : String(value) })}
              items={gameItems}
            >
              <SelectTrigger aria-label={t("buyer.auctionListPage.ariaLabel3", "เลือกเกม")} className="h-9 w-full rounded-lg border-border bg-background sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {gameItems.map((game) => <SelectItem key={game.value} value={game.value}>{game.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={filters.sort}
              onValueChange={(value) => update({ sort: (value ?? "ENDING_SOON") as AuctionSort })}
              items={AUCTION_SORTS}
            >
              <SelectTrigger aria-label={t("buyer.auctionListPage.ariaLabel4", "เรียงลำดับ")} className="h-9 w-full rounded-lg border-border bg-background sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {AUCTION_SORTS.map((sort) => <SelectItem key={sort.value} value={sort.value}>{sort.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filters.game !== null && games.isError ? (
          <ErrorState error={games.error} onRetry={() => void games.refetch()} />
        ) : !ready || auctions.isPending ? (
          <div role="status" aria-busy="true" aria-label={t("buyer.auctionListPage.ariaLabel5", "กำลังโหลดประมูล")}>
            <ItemGridSkeleton count={8} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" imageClassName="aspect-square" />
          </div>
        ) : auctions.isError ? (
          <ErrorState error={auctions.error} onRetry={() => void auctions.refetch()} />
        ) : auctions.data.page.items.length === 0 ? (
          hasActiveAuctionFilters(filters) ? (
            <EmptyState
              icon={SearchX}
              title={filters.q ? t("buyer.auctionListPage.text6", "ไม่พบประมูลที่ตรงกับ \"{q}\"", { q: filters.q }) : t("buyer.auctionListPage.text7", "ไม่พบประมูลที่ตรงกับตัวกรอง")}
              description={t("buyer.auctionListPage.description", "ลองคำค้นอื่น หรือล้างตัวกรองเกม / สถานะ")}
              className="rounded-2xl bg-background"
            >
              <Button variant="outline" className="rounded-full" onClick={clearFilters}>{t("buyer.auctionListPage.text8", "ล้างตัวกรอง")}</Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Gavel}
              title={t("buyer.auctionListPage.title", "ยังไม่มีประมูลที่เปิดอยู่")}
              description={t("buyer.auctionListPage.description2", "กลับมาดูใหม่เร็ว ๆ นี้ หรือเลือกซื้อการ์ดในตลาดไปก่อน")}
              className="rounded-2xl bg-background"
            >
              <Button variant="outline" className="rounded-full" nativeButton={false} render={<Link to="/products" />}>{t("buyer.auctionListPage.text9", "ไปที่ตลาด")}</Button>
            </EmptyState>
          )
        ) : (
          <>
            <div
              className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", auctions.isPlaceholderData && "opacity-60")}
              aria-busy={auctions.isPlaceholderData}
            >
              {auctions.data.page.items.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} serverTime={auctions.data.serverTime} />
              ))}
            </div>
            {auctions.data.page.totalPages > 1 ? (
              <AuctionPagination
                current={filters.page}
                total={auctions.data.page.totalPages}
                pageHref={pageHref}
                goToPage={goToPage}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/** ตัวเลขในแท็บ — "ทั้งหมด" ใช้ `totalLive` ที่เหลือใช้ `filterCounts` */
function countFor(data: AuctionPage | undefined, tab: AuctionFilter | null): number | null {
  if (!data) return null;
  return tab === null ? data.totalLive : data.filterCounts[tab];
}

function FilterTab({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string;
  count: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-foreground hover:border-primary/40",
      )}
    >
      {label}
      {count !== null ? (
        <span className={cn("text-xs font-medium tabular-nums", selected ? "text-background/80" : "text-muted-foreground")}>
          {count.toLocaleString(intlLocale())}
        </span>
      ) : null}
    </button>
  );
}

function AuctionPagination({
  current,
  total,
  pageHref,
  goToPage,
}: {
  current: number;
  total: number;
  pageHref: (page: number) => string;
  goToPage: (page: number) => (event: MouseEvent) => void;
}) {
  const { t } = useTranslate("auction");
  const previous = Math.max(1, current - 1);
  const next = Math.min(total, current + 1);
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text={t("buyer.auctionListPage.text10", "ก่อนหน้า")}
            href={pageHref(previous)}
            onClick={goToPage(previous)}
            aria-disabled={current <= 1}
            className={cn(current <= 1 && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
        {pageWindow(current, total).map((number, index) =>
          number === null ? (
            <PaginationItem key={`gap-${index}`}><PaginationEllipsis /></PaginationItem>
          ) : (
            <PaginationItem key={number}>
              <PaginationLink href={pageHref(number)} onClick={goToPage(number)} isActive={number === current}>
                {number}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            text={t("buyer.auctionListPage.text11", "ถัดไป")}
            href={pageHref(next)}
            onClick={goToPage(next)}
            aria-disabled={current >= total}
            className={cn(current >= total && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
