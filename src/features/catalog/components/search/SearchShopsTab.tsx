import type { MouseEvent } from "react";
import { CheckIcon, SlidersHorizontalIcon, StarIcon, StoreIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/features/catalog/catalog.mappers";
import { useGameList, useSearchShops } from "@/features/catalog/catalog.queries";
import type { GameDto, SearchFacetsDto, SearchShopDto } from "@/features/catalog/catalog.types";
import {
  SHOP_PAGE_SIZE,
  SHOP_RATINGS,
  pageWindow,
  toShopQuery,
  writeFilters,
  type SearchFilters,
  type ShopRating,
} from "@/features/catalog/search.params";
import { ApiError } from "@/lib/api";
import { translateError, useFormat, useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * แท็บ "ร้านค้า" ของหน้าค้นหา [TCG-778 SRCH-07] — Figma SRCH-6 3056-15916
 *
 * sidebar: เกม (ตัวเลขจาก facets ของสินค้า) + คะแนนร้าน (`minRating`)
 * "ระยะเวลาจัดส่ง" / "ที่ตั้งร้าน" / badge ยืนยันแล้ว / บรรทัดจัดส่ง-ที่ตั้ง ยังไม่มีข้อมูลจาก API — ซ่อนไว้
 */
export function SearchShopsTab({
  filters,
  facets,
  onChange,
  onClear,
  onBackToProducts,
}: {
  filters: SearchFilters;
  facets: SearchFacetsDto | undefined;
  onChange: (patch: Partial<SearchFilters>) => void;
  onClear: () => void;
  onBackToProducts: () => void;
}) {
  const { t } = useTranslate("buyer");
  const format = useFormat();
  const games = useGameList();
  const { query, ready } = toShopQuery(filters, games.data);
  const shops = useSearchShops(query, ready);
  const data = shops.data;

  const ratingLabel = (rating: ShopRating) => t("search.shops.ratingAtLeast", "{rating} ขึ้นไป", { rating });
  const sorts = [
    { value: "MATCHES", label: t("search.shops.sortMatches", "สินค้าตรงมากที่สุด") },
    { value: "RATING", label: t("search.shops.sortRating", "คะแนนสูงสุด") },
  ];
  const filtered = filters.games.length > 0 || filters.minRating !== null;

  const pageHref = (page: number) => `?${writeFilters({ ...filters, page })}`;
  const goToPage = (page: number) => (event: MouseEvent) => {
    event.preventDefault();
    onChange({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sidebar = (
    <div className="flex flex-col">
      <section className="pb-4">
        <h3 className="mb-3 text-sm font-semibold">{t("search.game", "เกม")}</h3>
        {(games.data ?? []).map((game: GameDto) => {
          const count = facets ? (facets.games.find((item) => item.id === game.id)?.count ?? 0) : undefined;
          const checked = filters.games.includes(game.slug);
          const disabled = !checked && count === 0;
          return (
            <label
              key={game.id}
              htmlFor={`shop-game-${game.slug}`}
              data-disabled={disabled || undefined}
              className="flex min-h-8 cursor-pointer items-center gap-2.5 text-sm data-disabled:cursor-not-allowed data-disabled:opacity-45"
            >
              <Checkbox
                id={`shop-game-${game.slug}`}
                checked={checked}
                disabled={disabled}
                onCheckedChange={() =>
                  onChange({
                    games: checked ? filters.games.filter((slug) => slug !== game.slug) : [...filters.games, game.slug],
                  })
                }
              />
              <span className="min-w-0 flex-1 truncate">{game.name}</span>
              {count !== undefined ? <span className="text-xs text-muted-foreground">{format.number(count)}</span> : null}
            </label>
          );
        })}
      </section>
      <section className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-semibold">{t("search.shops.rating", "คะแนนร้าน")}</h3>
        <div className="flex flex-wrap gap-2">
          {[...SHOP_RATINGS, null].map((rating) => {
            const active = filters.minRating === rating;
            return (
              <button
                key={rating ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ minRating: rating })}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px]",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted",
                )}
              >
                {active ? <CheckIcon className="size-3.5" /> : null}
                {rating ? (
                  <>
                    <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                    {ratingLabel(rating)}
                  </>
                ) : (
                  t("search.shops.ratingAll", "ทั้งหมด")
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );

  let body;
  if (shops.isError && !data) {
    body = (
      <div role="alert" className="flex flex-col items-center rounded-xl border border-border bg-background px-6 py-14 text-center">
        <TriangleAlertIcon className="size-8 text-destructive" />
        <h2 className="mt-3 text-lg font-bold">{t("search.shops.failed", "โหลดร้านค้าไม่สำเร็จ")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {translateError(shops.error, t("search.error.hint", "ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง ตัวกรองที่เลือกไว้ยังอยู่"))}
        </p>
        {shops.error instanceof ApiError ? (
          <p className="mt-1 font-mono text-xs text-muted-foreground">{t("search.error.code", "รหัส: {code}", { code: shops.error.code })}</p>
        ) : null}
        <Button className="mt-5" onClick={() => void shops.refetch()}>
          {t("search.error.retry", "ลองอีกครั้ง")}
        </Button>
      </div>
    );
  } else if (!data) {
    body = (
      <div aria-hidden="true" className="flex flex-col gap-3" data-testid="shop-skeleton">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="hidden h-14 w-48 sm:block" />
          </div>
        ))}
      </div>
    );
  } else if (data.items.length === 0) {
    body = (
      <div className="flex flex-col items-center rounded-xl border border-border bg-background px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <StoreIcon className="size-6 text-muted-foreground" />
        </span>
        <h2 className="mt-4 text-lg font-bold">
          {filters.q
            ? t("search.shops.empty", "ไม่มีร้านที่ขาย “{query}”", { query: filters.q })
            : t("search.shops.emptyNoQuery", "ไม่พบร้านค้า")}
        </h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {filtered ? (
            <Button variant="outline" onClick={onClear}>
              {t("search.clearAllFilters", "ล้างตัวกรองทั้งหมด")}
            </Button>
          ) : null}
          <Button onClick={onBackToProducts}>{t("search.shops.backToProducts", "กลับไปดูสินค้า")}</Button>
        </div>
      </div>
    );
  } else {
    const from = (filters.page - 1) * SHOP_PAGE_SIZE + 1;
    const to = Math.min(filters.page * SHOP_PAGE_SIZE, data.totalItems);
    body = (
      <>
        <div className={cn("flex flex-col gap-3", shops.isPlaceholderData && "opacity-60")} aria-busy={shops.isPlaceholderData}>
          {data.items.map((shop) => (
            <ShopResult key={shop.username} shop={shop} query={filters.q} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("search.shops.showing", "แสดง {from}–{to} จาก {total} ร้านค้า", {
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
                    href={pageHref(Math.max(1, filters.page - 1))}
                    onClick={goToPage(Math.max(1, filters.page - 1))}
                    aria-disabled={filters.page <= 1}
                    className={cn(filters.page <= 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {pageWindow(filters.page, data.totalPages).map((number, index) =>
                  number === null ? (
                    <PaginationItem key={`gap-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={number}>
                      <PaginationLink href={pageHref(number)} onClick={goToPage(number)} isActive={number === filters.page}>
                        {number}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href={pageHref(Math.min(data.totalPages, filters.page + 1))}
                    onClick={goToPage(Math.min(data.totalPages, filters.page + 1))}
                    aria-disabled={filters.page >= data.totalPages}
                    className={cn(filters.page >= data.totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden rounded-xl border border-border bg-background p-4 md:block" aria-label={t("search.filters", "ตัวกรองการค้นหา")}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <SlidersHorizontalIcon className="size-4" />
            {t("search.filter.title", "ตัวกรอง")}
          </h2>
          {filtered ? (
            <button type="button" onClick={onClear} className="text-xs font-semibold text-primary hover:underline">
              {t("search.filter.clearAll", "ล้างทั้งหมด")}
            </button>
          ) : null}
        </div>
        {sidebar}
      </aside>

      <section className="min-w-0" aria-label={t("search.shops.results", "ร้านค้าที่ขาย")}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filters.minRating ? (
            <button
              type="button"
              onClick={() => onChange({ minRating: null })}
              aria-label={t("search.filter.remove", "เอา “{label}” ออก", { label: ratingLabel(filters.minRating) })}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
              {ratingLabel(filters.minRating)}
              <XIcon className="size-3.5" />
            </button>
          ) : null}
          {/* มือถือ: คะแนนร้านเป็น chip แถวเดียว แทน sidebar */}
          <div className="flex gap-2 md:hidden">
            {SHOP_RATINGS.filter((rating) => rating !== filters.minRating).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange({ minRating: rating })}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-background px-3 text-[13px]"
              >
                <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
                {ratingLabel(rating)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{t("search.sortBy", "เรียงตาม:")}</span>
            <Select
              value={filters.shopSort}
              onValueChange={(value) => onChange({ shopSort: value === "RATING" ? "RATING" : "MATCHES" })}
              items={sorts}
            >
              <SelectTrigger aria-label={t("search.sortBy", "เรียงตาม:")} className="w-44 rounded-md border-border bg-background">
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
          </div>
        </div>
        {body}
      </section>
    </div>
  );
}

/** Figma "Search/Shop Result" 3056-15877 */
function ShopResult({ shop, query }: { shop: SearchShopDto; query: string }) {
  const { t } = useTranslate("buyer");
  const format = useFormat();
  const name = shop.displayName || shop.username;
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const shopHref = `/u/${encodeURIComponent(shop.username)}`;
  const previews = shop.previews.slice(0, 3);
  const more = Math.max(shop.matchCount - previews.length, 0);

  return (
    <article
      data-testid="shop-result"
      className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-bold text-muted-foreground">
          {shop.avatarUrl ? <img src={shop.avatarUrl} alt="" className="size-full object-cover" /> : initials}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-semibold">
            <Link to={shopHref} className="hover:underline">
              {name}
            </Link>
          </h3>
          {shop.ratingAvg !== null && shop.ratingCount > 0 ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <StarIcon className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {t("search.shops.ratingSummary", "{rating} ({count} รีวิว)", {
                rating: format.number(shop.ratingAvg, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                count: format.number(shop.ratingCount),
              })}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {query
              ? t("search.shops.matches", "{count} สินค้าที่ตรงกับ “{query}”", { count: format.number(shop.matchCount), query })
              : t("search.shops.matchesNoQuery", "{count} สินค้า", { count: format.number(shop.matchCount) })}
            {shop.lowestPrice !== null ? (
              <> · {t("search.shops.from", "เริ่มต้น {price}", { price: formatPrice(shop.lowestPrice) })}</>
            ) : null}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        {previews.map((preview, index) => (
          <Link
            key={preview.productId}
            to={`/products/${preview.productId}`}
            aria-label={t("search.shops.preview", "สินค้าตัวอย่างจาก {shop}", { shop: name })}
            className={cn("size-14 overflow-hidden rounded-lg border border-border bg-muted", index === 2 && "hidden sm:block")}
          >
            {preview.imageUrl ? <img src={preview.imageUrl} alt="" loading="lazy" className="size-full object-contain" /> : null}
          </Link>
        ))}
        {more > 0 ? (
          <Link
            to={shopHref}
            className="flex size-14 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground"
          >
            +{format.number(more)}
          </Link>
        ) : null}
        <Button variant="outline" className="ml-auto sm:ml-2" nativeButton={false} render={<Link to={shopHref} />}>
          {t("search.shops.viewShop", "ดูร้าน")}
        </Button>
      </div>
    </article>
  );
}
