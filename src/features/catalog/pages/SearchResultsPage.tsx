import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import {
  ArrowRightIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ActiveFilterChips } from "@/features/catalog/components/search/ActiveFilterChips";
import { SearchFilterPanel } from "@/features/catalog/components/search/SearchFilterPanel";
import { SearchShopsTab } from "@/features/catalog/components/search/SearchShopsTab";
import {
  SearchResultCard,
  SearchResultRow,
  SearchResultsSkeleton,
  type ResultContext,
} from "@/features/catalog/components/search/SearchResultItems";
import {
  useCategoryList,
  useGameList,
  useProductSearch,
  useSearchFacets,
  useSearchSuggest,
} from "@/features/catalog/catalog.queries";
import type { ProductSummaryDto } from "@/features/catalog/catalog.types";
import {
  SEARCH_PAGE_SIZE,
  SEARCH_SORT_MENU,
  clearedFilters,
  hasActiveFilters,
  pageWindow,
  readFilters,
  readViewPreference,
  saveViewPreference,
  toProductQuery,
  switchTab,
  writeFilters,
  type SearchFilters,
  type SearchSort,
  type SearchView,
} from "@/features/catalog/search.params";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApiError, type PageResponse } from "@/lib/api";
import { translateError, useFormat, useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** loading สั้นกว่านี้ไม่ต้องกระพริบเป็น skeleton */
const SKELETON_DELAY_MS = 300;

function useDelayedFlag(active: boolean, delay: number) {
  const [shown, setShown] = useState<{ since: boolean; value: boolean }>({ since: active, value: false });
  if (shown.since !== active) setShown({ since: active, value: false });
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setShown({ since: true, value: true }), delay);
    return () => window.clearTimeout(timer);
  }, [active, delay]);
  return active && shown.value;
}

/**
 * หน้าผลการค้นหา `/search` [TCG-777 SRCH-06]
 *
 * ทุกตัวกรอง / การเรียง / มุมมอง / หน้า อยู่ใน URL — แชร์ลิงก์ได้ กด back ได้
 * เปลี่ยนตัวกรองแล้วกลับหน้า 1 (TCG-589) · มือถือใช้ "โหลดเพิ่ม" แทน pagination
 * (หน้า N บนมือถือ = แสดง N × 24 ชิ้นแรก ในคำขอเดียว)
 */
export function SearchResultsPage() {
  const { t } = useTranslate("buyer");
  const format = useFormat();
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const isMobile = useIsMobile();
  const [preferredView, setPreferredView] = useState<SearchView>(readViewPreference);
  // มือถือไม่มีปุ่มสลับมุมมอง — grid 2 คอลัมน์เสมอ
  const view: SearchView = isMobile ? "grid" : (filters.view ?? preferredView);
  const [sheetOpen, setSheetOpen] = useState(false);

  const games = useGameList();
  const categories = useCategoryList();
  const context: ResultContext = { games: games.data, categories: categories.data };
  const { query: pageQuery, ready } = toProductQuery(filters, games.data, categories.data);
  const query = isMobile ? { ...pageQuery, page: 0, size: SEARCH_PAGE_SIZE * filters.page } : pageQuery;
  const results = useProductSearch(query, ready && filters.tab === "products");
  const facets = useSearchFacets(pageQuery, ready);
  const related = useSearchSuggest(filters.q);
  const popular = useProductSearch({ sort: "popular", size: 4, inStock: true }, results.data?.totalItems === 0);

  const sortLabels: Record<(typeof SEARCH_SORT_MENU)[number], string> = {
    relevance: t("search.sortMenu.relevance", "เกี่ยวข้องที่สุด"),
    price_asc: t("search.sortMenu.priceAsc", "ราคา: ต่ำ → สูง"),
    price_desc: t("search.sortMenu.priceDesc", "ราคา: สูง → ต่ำ"),
    newest: t("search.sortMenu.newest", "มาใหม่ล่าสุด"),
    featured: t("search.sortMenu.popular", "ขายดีที่สุด"),
  };
  const sorts = SEARCH_SORT_MENU.map((value) => ({ value, label: sortLabels[value] }));

  const update = (patch: Partial<SearchFilters>) =>
    setParams((current) => writeFilters({ ...readFilters(current), page: 1, ...patch }));
  const clearAll = () => setParams((current) => writeFilters({ ...clearedFilters(readFilters(current)), page: 1 }));
  const setView = (next: SearchView) => {
    saveViewPreference(next);
    setPreferredView(next);
    setParams((current) => writeFilters({ ...readFilters(current), view: next }), { replace: true });
  };
  const goToPage = (page: number) => (event: MouseEvent) => {
    event.preventDefault();
    setParams((current) => writeFilters({ ...readFilters(current), page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const loadMore = () =>
    setParams((current) => writeFilters({ ...readFilters(current), page: filters.page + 1 }), { replace: true });
  const pageHref = (page: number) => `?${writeFilters({ ...filters, page })}`;
  const searchHref = (q: string) => `/search?${writeFilters({ ...clearedFilters(filters), q, page: 1 })}`;

  const data = results.data;
  const filtered = hasActiveFilters(filters);
  const waiting = !ready || results.isPending;
  const showSkeleton = useDelayedFlag(waiting, SKELETON_DELAY_MS);
  const refreshing = results.isFetching;
  const totalProducts = facets.data?.totals.products ?? data?.totalItems;
  const totalShops = facets.data?.totals.shops;

  // ?page= เกินจำนวนหน้าจริง — พาไปหน้าสุดท้าย (desktop เท่านั้น มือถือหน้า N คือจำนวนที่โหลด)
  const lastPage = Math.max(data?.totalPages ?? 1, 1);
  const pageOverflow = !isMobile && data !== undefined && !results.isPlaceholderData && filters.page > lastPage;
  useEffect(() => {
    if (pageOverflow) {
      setParams((current) => writeFilters({ ...readFilters(current), page: lastPage }), { replace: true });
    }
  }, [pageOverflow, lastPage, setParams]);

  const correction = data?.correctedQuery ? (
    <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary" role="status">
      {data.correctionReason === "ALIAS"
        ? t("search.correctedAlias", "รวมผลของ “{corrected}” สำหรับ “{query}”", { corrected: data.correctedQuery, query: filters.q })
        : t("search.corrected", "แสดงผลลัพธ์ของ “{corrected}” · คุณค้นหา “{query}”", {
            corrected: data.correctedQuery,
            query: filters.q,
          })}
    </p>
  ) : null;

  const relatedTerms = (related.data?.completions ?? []).filter(
    (term) => term.toLocaleLowerCase() !== filters.q.toLocaleLowerCase(),
  );

  const results$ = (() => {
    if (results.isError && !data) {
      return <SearchError error={results.error} onRetry={() => void results.refetch()} />;
    }
    if (!data) {
      // เกิน 300ms ค่อยโชว์ skeleton — ก่อนหน้านั้นจองพื้นที่ไว้เฉย ๆ layout จะได้ไม่กระโดด
      return (
        <div className={cn(!showSkeleton && "invisible")}>
          <SearchResultsSkeleton view={view} count={isMobile ? 6 : 12} />
        </div>
      );
    }
    if (data.items.length === 0) {
      return (
        <SearchEmpty
          query={filters.q}
          suggestion={relatedTerms[0]}
          filtered={filtered}
          onClear={clearAll}
          searchHref={searchHref}
          popular={popular.data?.items ?? []}
          context={context}
        />
      );
    }
    return (
      <>
        <div
          className={cn(
            view === "grid" ? "grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" : "flex flex-col gap-3",
            results.isPlaceholderData && "opacity-60 transition-opacity",
          )}
          aria-busy={results.isPlaceholderData}
        >
          {data.items.map((product) =>
            view === "grid" ? (
              <SearchResultCard key={product.id} product={product} context={context} />
            ) : (
              <SearchResultRow key={product.id} product={product} context={context} />
            ),
          )}
        </div>
        {filters.q && relatedTerms.length > 0 ? (
          <section className="mt-6 rounded-xl border border-border bg-background p-4">
            <h2 className="text-sm font-semibold">{t("search.related", "การค้นหาที่เกี่ยวข้อง")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedTerms.map((term) => (
                <Link
                  key={term}
                  to={searchHref(term)}
                  className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[13px] hover:bg-muted"
                >
                  {term}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <ResultsFooter
          isMobile={isMobile}
          data={data}
          page={filters.page}
          pageHref={pageHref}
          goToPage={goToPage}
          loadMore={loadMore}
          loading={results.isFetching}
        />
      </>
    );
  })();

  return (
    <div className="min-h-[783px] bg-muted font-sans">
      {refreshing ? (
        <div role="progressbar" aria-label={t("search.searching", "กำลังค้นหา…")} className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20">
          <div className="h-full w-full animate-pulse bg-primary" />
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 pt-6 pb-14 sm:px-6 lg:px-[21px]">
        <Breadcrumb>
          <BreadcrumbList className="text-[12px]">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>{t("nav.home", "หน้าแรก", { ns: "common" })}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("search.breadcrumb", "ผลการค้นหา")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-[-0.02em] sm:text-[32px] sm:leading-[39px]">
              {filters.q ? t("search.titleFor", "ผลการค้นหา “{query}”", { query: filters.q }) : t("search.title", "สินค้าทั้งหมด")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {filters.tab === "shops"
                ? totalShops !== undefined
                  ? filters.q
                    ? t("search.shops.summary", "พบ {count} ร้านค้าที่ขาย “{query}”", { count: format.number(totalShops), query: filters.q })
                    : t("search.shops.summaryNoQuery", "พบ {count} ร้านค้า", { count: format.number(totalShops) })
                  : t("search.searching", "กำลังค้นหา…")
                : waiting && !data
                ? t("search.searching", "กำลังค้นหา…")
                : totalProducts === 0
                  ? t("search.noResultsSummary", "ไม่พบสินค้าที่ตรงกับคำค้นและตัวกรองที่เลือก")
                  : totalShops !== undefined
                    ? t("search.summary", "พบ {products} สินค้า จาก {shops} ร้านค้า", {
                        products: format.number(totalProducts ?? 0),
                        shops: format.number(totalShops),
                      })
                    : t("search.resultCount", "{count, plural, other {# รายการ}}", { count: totalProducts ?? 0 })}
            </p>
          </div>
          <nav aria-label={t("search.tabs", "ประเภทผลการค้นหา")} className="flex shrink-0 overflow-x-auto border-b border-border">
            {(["products", "shops"] as const).map((tab) => {
              const active = filters.tab === tab;
              const count = facets.data ? (tab === "products" ? facets.data.totals.products : facets.data.totals.shops) : undefined;
              return (
                <Link
                  key={tab}
                  to={`?${writeFilters(switchTab(filters, tab))}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-4 pb-2 text-sm whitespace-nowrap",
                    active ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab === "products" ? t("search.tab.products", "สินค้า") : t("search.tab.shops", "ร้านค้า")}
                  {count !== undefined ? (
                    <span className={cn("text-xs", active && "rounded-full bg-primary px-2 text-primary-foreground")}>
                      {format.number(count)}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <span className="flex items-center gap-2 px-4 pb-2 text-sm whitespace-nowrap text-muted-foreground">
              {t("search.tab.listings", "รายการขาย")}
              {facets.data ? <span className="text-xs">{format.number(facets.data.totals.listings)}</span> : null}
            </span>
          </nav>
        </header>

        {filters.tab === "products" ? correction : null}

        {filters.tab === "shops" ? (
          <SearchShopsTab
            filters={filters}
            facets={facets.data}
            onChange={update}
            onClear={() => update({ games: [], minRating: null })}
            onBackToProducts={() => setParams((current) => writeFilters(switchTab(readFilters(current), "products")))}
          />
        ) : (
        <div className="grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside
            className="hidden rounded-xl border border-border bg-background p-4 md:block"
            aria-label={t("search.filters", "ตัวกรองการค้นหา")}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <SlidersHorizontalIcon className="size-4" />
                {t("search.filter.title", "ตัวกรอง")}
              </h2>
              {filtered ? (
                <button type="button" onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
                  {t("search.filter.clearAll", "ล้างทั้งหมด")}
                </button>
              ) : null}
            </div>
            <SearchFilterPanel filters={filters} facets={facets.data} games={games.data} categories={categories.data} onChange={update} />
          </aside>

          <section className="min-w-0" aria-label={t("search.results", "ผลการค้นหา")}>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 md:hidden">
                <Button variant="outline" className="rounded-full" onClick={() => setSheetOpen(true)}>
                  <SlidersHorizontalIcon className="size-4" />
                  {t("search.filter.button", "ตัวกรอง")}
                  {filtered ? ` (${activeCount(filters)})` : ""}
                </Button>
                <SortSelect value={filters.sort} sorts={sorts} onChange={(sort) => update({ sort })} className="ml-auto" />
              </div>
              <ActiveFilterChips
                filters={filters}
                games={games.data}
                categories={categories.data}
                onChange={update}
                onClear={clearAll}
                className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0"
              />
              <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
                <span className="text-sm text-muted-foreground">{t("search.sortBy", "เรียงตาม:")}</span>
                <SortSelect value={filters.sort} sorts={sorts} onChange={(sort) => update({ sort })} />
                <div className="flex rounded-md border border-border bg-background p-0.5" role="group" aria-label={t("search.view.label", "มุมมอง")}>
                  <ViewButton active={view === "grid"} label={t("search.view.grid", "ตาราง")} onClick={() => setView("grid")}>
                    <LayoutGridIcon className="size-4" />
                  </ViewButton>
                  <ViewButton active={view === "list"} label={t("search.view.list", "รายการ")} onClick={() => setView("list")}>
                    <ListIcon className="size-4" />
                  </ViewButton>
                </div>
              </div>
            </div>

            {results$}
          </section>
        </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[90dvh] rounded-t-2xl p-0" showCloseButton>
          <div className="border-b border-border px-4 py-4">
            <SheetTitle className="text-lg font-bold">{t("search.filter.title", "ตัวกรอง")}</SheetTitle>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <SearchFilterPanel filters={filters} facets={facets.data} games={games.data} categories={categories.data} onChange={update} />
          </div>
          <div className="flex gap-3 border-t border-border p-4">
            <Button variant="outline" onClick={clearAll}>
              {t("search.filter.clearAll", "ล้างทั้งหมด")}
            </Button>
            <Button className="flex-1" onClick={() => setSheetOpen(false)}>
              {t("search.filter.showResults", "ดูผลลัพธ์ {count} รายการ", { count: format.number(totalProducts ?? 0) })}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function activeCount(filters: SearchFilters) {
  return (
    filters.games.length +
    (filters.category ? 1 : 0) +
    filters.conditions.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.inStock ? 1 : 0)
  );
}

function SortSelect({
  value,
  sorts,
  onChange,
  className,
}: {
  value: SearchSort;
  sorts: { value: SearchSort; label: string }[];
  onChange: (sort: SearchSort) => void;
  className?: string;
}) {
  const { t } = useTranslate("buyer");
  return (
    <Select value={value} onValueChange={(next) => onChange((next ?? "relevance") as SearchSort)} items={sorts}>
      <SelectTrigger aria-label={t("search.sortBy", "เรียงตาม:")} className={cn("w-44 rounded-md border-border bg-background", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {sorts.map((sort) => (
            <SelectItem key={sort.value} value={sort.value}>
              {sort.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn("flex size-8 items-center justify-center rounded", active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
    >
      {children}
    </button>
  );
}

function ResultsFooter({
  isMobile,
  data,
  page,
  pageHref,
  goToPage,
  loadMore,
  loading,
}: {
  isMobile: boolean;
  data: PageResponse<ProductSummaryDto>;
  page: number;
  pageHref: (page: number) => string;
  goToPage: (page: number) => (event: MouseEvent) => void;
  loadMore: () => void;
  loading: boolean;
}) {
  const { t } = useTranslate("buyer");
  const format = useFormat();

  if (isMobile) {
    return data.items.length < data.totalItems ? (
      <div className="mt-6 flex justify-center">
        <Button variant="outline" className="w-full max-w-xs" onClick={loadMore} disabled={loading}>
          {t("search.loadMore", "โหลดเพิ่ม")}
        </Button>
      </div>
    ) : null;
  }

  const from = (page - 1) * SEARCH_PAGE_SIZE + 1;
  const to = Math.min(page * SEARCH_PAGE_SIZE, data.totalItems);
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {t("search.showing", "แสดง {from}–{to} จาก {total} สินค้า", {
          from: format.number(from),
          to: format.number(to),
          total: format.number(data.totalItems),
        })}
      </p>
      {data.totalPages > 1 ? (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={pageHref(Math.max(1, page - 1))}
                onClick={goToPage(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={cn(page <= 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {pageWindow(page, data.totalPages).map((number, index) =>
              number === null ? (
                <PaginationItem key={`gap-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={number}>
                  <PaginationLink href={pageHref(number)} onClick={goToPage(number)} isActive={number === page}>
                    {number}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href={pageHref(Math.min(data.totalPages, page + 1))}
                onClick={goToPage(Math.min(data.totalPages, page + 1))}
                aria-disabled={page >= data.totalPages}
                className={cn(page >= data.totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}

function SearchError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslate("buyer");
  const code = error instanceof ApiError ? error.code : null;
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-border bg-background px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlertIcon className="size-6 text-destructive" />
      </span>
      <h2 className="mt-4 text-lg font-bold">{t("search.error.title", "โหลดผลการค้นหาไม่สำเร็จ")}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {translateError(error, t("search.error.hint", "ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง ตัวกรองที่เลือกไว้ยังอยู่"))}
      </p>
      {code ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {t("search.error.code", "รหัส: {code}", { code })}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="outline" nativeButton={false} render={<Link to="/" />}>
          {t("search.error.home", "กลับหน้าแรก")}
        </Button>
        <Button onClick={onRetry}>{t("search.error.retry", "ลองอีกครั้ง")}</Button>
      </div>
    </div>
  );
}

function SearchEmpty({
  query,
  suggestion,
  filtered,
  onClear,
  searchHref,
  popular,
  context,
}: {
  query: string;
  suggestion: string | undefined;
  filtered: boolean;
  onClear: () => void;
  searchHref: (q: string) => string;
  popular: ProductSummaryDto[];
  context: ResultContext;
}) {
  const { t } = useTranslate("buyer");
  return (
    <>
      <div className="flex flex-col items-center rounded-xl border border-border bg-background px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <SearchIcon className="size-6 text-muted-foreground" />
        </span>
        <h2 className="mt-4 text-lg font-bold sm:text-xl">
          {query ? t("search.noMatch", "ไม่พบสินค้าที่ตรงกับ \"{query}\"", { query }) : t("search.empty", "ไม่พบสินค้า")}
        </h2>
        {suggestion ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("search.didYouMean", "คุณหมายถึง")}{" "}
            <Link to={searchHref(suggestion)} className="font-semibold text-primary underline">
              {suggestion}
            </Link>{" "}
            {t("search.didYouMeanSuffix", "ใช่ไหม?")}
          </p>
        ) : null}
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          <li>• {t("search.tips.spelling", "ตรวจสะกด หรือใช้ชื่อภาษาอังกฤษของการ์ด")}</li>
          <li>• {t("search.tips.number", "ค้นด้วยเลขการ์ด เช่น 020/189 หรือรหัสชุด sv2a")}</li>
          {filtered ? <li>• {t("search.tips.filters", "ลองเอาตัวกรองบางรายการออก")}</li> : null}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {filtered ? (
            <Button variant="outline" onClick={onClear}>
              {t("search.clearAllFilters", "ล้างตัวกรองทั้งหมด")}
            </Button>
          ) : null}
          {suggestion ? (
            <Button nativeButton={false} render={<Link to={searchHref(suggestion)} />}>
              {t("search.searchInstead", "ค้นหา “{query}” แทน", { query: suggestion })}
            </Button>
          ) : null}
        </div>
      </div>
      {popular.length > 0 ? (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("search.popularNow", "สินค้ายอดนิยมตอนนี้")}</h2>
            <Link to="/search?sort=featured" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {t("search.viewAll", "ดูทั้งหมด")}
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {popular.map((product) => (
              <SearchResultCard key={product.id} product={product} context={context} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
