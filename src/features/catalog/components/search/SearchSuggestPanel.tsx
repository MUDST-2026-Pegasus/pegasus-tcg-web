import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  ClockIcon,
  LayoutGridIcon,
  SearchIcon,
  TagIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryList, useGameList, useSearchSuggest, useTrendingSearches } from "@/features/catalog/catalog.queries";
import type { SearchSuggestProductDto } from "@/features/catalog/catalog.types";
import { SearchOptionList, type SearchOption } from "@/features/catalog/search/search-options";
import type { ViewedProduct } from "@/features/catalog/search/search-history";
import { useSearchHistory } from "@/features/catalog/search/use-search-history";
import { useFormat, useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const POPULAR_GAMES = 5;

type Built = { options: SearchOption[]; body: ReactNode; footer: ReactNode; status: string };

/**
 * เนื้อหา dropdown ค้นหา [TCG-776] — ใช้ทั้ง popover บน desktop (`layout="columns"`)
 * และหน้าเต็มจอบนมือถือ (`layout="stack"`)
 *
 * ลำดับแถวใน `options` ตรงกับลำดับใน DOM เพราะสร้างไปพร้อมกับตอน render
 */
export function useSearchSuggestPanel({
  query,
  idPrefix,
  layout,
  highlighted,
  searchHref,
  onSelect,
  onHover,
}: {
  query: string;
  idPrefix: string;
  layout: "columns" | "stack";
  highlighted: number;
  searchHref: (term: string, extra?: Record<string, string>) => string;
  onSelect: (option: SearchOption) => void;
  onHover: (index: number) => void;
}): Built {
  const { t } = useTranslate("buyer");
  const format = useFormat();
  const history = useSearchHistory();
  const term = query.trim();
  const suggest = useSearchSuggest(query);
  const trending = useTrendingSearches();
  const { data: games } = useGameList();
  const { data: categories } = useCategoryList();
  const list = new SearchOptionList(idPrefix);

  const row = (
    option: SearchOption & { index: number },
    children: ReactNode,
    className?: string,
  ) => (
    <Link
      key={option.id}
      id={option.id}
      to={option.href}
      role="option"
      aria-selected={highlighted === option.index}
      tabIndex={-1}
      onMouseMove={() => onHover(option.index)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        onSelect(option);
      }}
      className={cn(
        "group/row flex items-center gap-3 rounded-lg px-2 text-sm text-foreground outline-none aria-selected:bg-muted",
        className,
      )}
    >
      {children}
    </Link>
  );

  const chip = (option: SearchOption & { index: number }, label: ReactNode) =>
    row(
      option,
      label,
      "h-8 shrink-0 rounded-full border border-border bg-background px-3 text-[13px] hover:bg-muted",
    );

  const heading = (label: ReactNode, action?: ReactNode) => (
    <div className="flex h-7 items-center justify-between px-2 text-xs font-medium text-muted-foreground">
      <span className="flex items-center gap-1.5">{label}</span>
      {action}
    </div>
  );

  const searchRow = (value: string, icon: ReactNode) =>
    row(
      list.add(searchHref(value), value),
      <>
        {icon}
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <ArrowUpRightIcon className="size-4 text-muted-foreground opacity-0 group-aria-selected/row:opacity-100" />
      </>,
      "h-9",
    );

  const productRow = (
    option: SearchOption & { index: number },
    product: {
      name: string;
      subtitle: string | null;
      imageUrl: string | null;
      lowestPrice: number | null;
      sellerCount: number | null;
    },
  ) =>
    row(
      option,
      <>
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {product.imageUrl && (
            <img src={product.imageUrl} alt="" loading="lazy" className="size-full object-contain" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{product.name}</span>
          {product.subtitle && (
            <span className="block truncate text-xs text-muted-foreground">{product.subtitle}</span>
          )}
        </span>
        <span className="shrink-0 text-right">
          {product.lowestPrice != null && (
            <span className="block text-[15px] font-bold text-primary">
              {format.money(product.lowestPrice)}
            </span>
          )}
          {product.sellerCount != null && product.sellerCount > 0 && (
            <span className="block text-xs text-muted-foreground">
              {t("searchSuggest.sellerCount", "{count} ร้าน", { count: product.sellerCount })}
            </span>
          )}
        </span>
      </>,
      "py-2",
    );

  const subtitle = (product: SearchSuggestProductDto) =>
    [product.setName, product.cardNumber, product.gameName].filter(Boolean).join(" · ") || null;

  const recentMatches = term
    ? history.recent.filter((item) => item.toLocaleLowerCase().includes(term.toLocaleLowerCase())).slice(0, 4)
    : [];

  const hintFooter = (text: ReactNode) => (
    <span className="truncate text-sm text-muted-foreground">{text}</span>
  );
  const seeAllFooter = (label: string) =>
    row(
      list.add(searchHref(term), term),
      <>
        <span className="truncate">{label}</span>
        <ArrowRightIcon className="size-4 shrink-0" />
      </>,
      "h-8 font-semibold text-primary hover:underline aria-selected:bg-transparent aria-selected:underline",
    );

  const columns = (left: ReactNode, right: ReactNode) =>
    layout === "columns" ? (
      <div className="grid grid-cols-[280px_1fr]">
        <div className="space-y-1 border-r border-border p-3">{left}</div>
        <div className="min-w-0 space-y-1 p-3 pl-4">{right}</div>
      </div>
    ) : (
      <div className="space-y-1 px-2 py-3">
        {left}
        {right}
      </div>
    );

  // ── ยังไม่พิมพ์ ─────────────────────────────────────────────
  if (!term) {
    const recentRows = history.recent.map((item) => (
      <div key={item} className="flex items-center">
        <div className="min-w-0 flex-1">
          {searchRow(item, <ClockIcon className="size-[18px] shrink-0 text-muted-foreground" />)}
        </div>
        <button
          type="button"
          aria-label={t("searchSuggest.removeRecent", "ลบ “{query}” ออกจากประวัติ", { query: item })}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => history.remove(item)}
          className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    ));
    const popularGames = [...(games ?? [])]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, POPULAR_GAMES)
      .map((game) => chip(list.add(`/search?game=${encodeURIComponent(game.slug)}`), game.name));
    const left = (
      <>
        {recentRows.length > 0 && (
          <section>
            {heading(
              t("searchSuggest.recent", "ค้นหาล่าสุด"),
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => history.clear()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("searchSuggest.clear", "ล้าง")}
              </button>,
            )}
            {recentRows}
          </section>
        )}
        {popularGames.length > 0 && (
          <section className="pt-1">
            {heading(t("searchSuggest.popularGames", "เกมยอดนิยม"))}
            <div className="flex flex-wrap gap-2 px-1 pt-1">{popularGames}</div>
          </section>
        )}
      </>
    );
    const trendingRows = (trending.data ?? []).map((item, index) => {
      const option = list.add(searchHref(item.query), item.query);
      return layout === "columns"
        ? row(
            option,
            <>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-bold",
                  index < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className="truncate">{item.query}</span>
            </>,
            "h-9",
          )
        : chip(option, item.query);
    });
    const viewedRows = history.viewed.map((product: ViewedProduct) =>
      productRow(list.add(`/products/${encodeURIComponent(product.slug)}`), product),
    );
    const right = (
      <>
        {trendingRows.length > 0 && (
          <section>
            {heading(
              <>
                <TrendingUpIcon className="size-3.5" />
                {t("searchSuggest.trending", "กำลังฮิตตอนนี้")}
              </>,
            )}
            <div
              className={
                layout === "columns" ? "grid grid-cols-2 gap-x-4" : "flex flex-wrap gap-2 px-1 pt-1"
              }
            >
              {trendingRows}
            </div>
          </section>
        )}
        {viewedRows.length > 0 && (
          <section className="pt-1">
            {heading(
              <>
                <ClockIcon className="size-3.5" />
                {t("searchSuggest.viewed", "ดูล่าสุด")}
              </>,
            )}
            {viewedRows}
          </section>
        )}
      </>
    );
    return {
      options: list.items,
      body: columns(left, right),
      footer: hintFooter(t("searchSuggest.hint", "พิมพ์ชื่อการ์ด ชุด หรือเลขการ์ด เช่น 020/189")),
      status: "",
    };
  }

  const data = suggest.data && suggest.data.query.trim() !== "" ? suggest.data : undefined;
  const waiting = !data && !suggest.isError;
  const failed = !data && suggest.isError;
  const empty =
    data &&
    suggest.settled &&
    !suggest.isPlaceholderData &&
    data.totalProducts === 0 &&
    data.completions.length === 0 &&
    data.shops.length === 0;

  // ── ไม่พบผลลัพธ์ ────────────────────────────────────────────
  if (empty) {
    const popular = (trending.data ?? []).map((item) => chip(list.add(searchHref(item.query), item.query), item.query));
    const body = (
      <div className="px-4 pt-8 pb-4">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <SearchIcon className="size-5 text-muted-foreground" />
          </span>
          <p className="mt-3 text-[17px] font-bold">
            {t("searchSuggest.noResults", "ไม่พบผลลัพธ์สำหรับ “{query}”", { query: term })}
          </p>
          {data.correctedQuery && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              {t("searchSuggest.didYouMean", "คุณหมายถึง")}
              {row(
                list.add(searchHref(data.correctedQuery), data.correctedQuery),
                data.correctedQuery,
                "inline-flex px-1 font-semibold text-primary underline",
              )}
              {t("searchSuggest.didYouMeanSuffix", "ใช่ไหม?")}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {t("searchSuggest.noResultsHint", "ลองตรวจตัวสะกด ใช้คำที่สั้นลง หรือค้นด้วยเลขการ์ด เช่น 020/189")}
          </p>
        </div>
        {popular.length > 0 && (
          <section className="mt-6">
            {heading(
              <>
                <TrendingUpIcon className="size-3.5" />
                {t("searchSuggest.tryPopular", "ลองค้นหายอดนิยม")}
              </>,
            )}
            <div className="flex flex-wrap gap-2 px-1 pt-1">{popular}</div>
          </section>
        )}
      </div>
    );
    return {
      options: list.items,
      body,
      footer: seeAllFooter(t("searchSuggest.searchFurther", "ค้นหา “{query}” ต่อในหน้าผลลัพธ์", { query: term })),
      status: t("searchSuggest.noResults", "ไม่พบผลลัพธ์สำหรับ “{query}”", { query: term }),
    };
  }

  // ── พิมพ์แล้ว (รวม loading / error ฝั่งสินค้า) ───────────────
  const completions = data && data.completions.length > 0 ? data.completions : recentMatches;
  const completionRows = completions.map((item) =>
    searchRow(item, <SearchIcon className="size-[18px] shrink-0 text-muted-foreground" />),
  );
  const scopes = data?.scopes ?? [];
  const scopeHref = (type: "GAME" | "CATEGORY", id: number) => {
    const slug =
      type === "GAME"
        ? games?.find((game) => game.id === id)?.slug
        : categories?.find((category) => category.id === id)?.slug;
    return slug ? searchHref(term, { [type === "GAME" ? "game" : "category"]: slug }) : null;
  };
  const scopeRows = scopes.flatMap((scope) => {
    const href = scopeHref(scope.type, scope.id);
    if (!href) return [];
    const Icon = scope.type === "GAME" ? LayoutGridIcon : TagIcon;
    return [
      row(
        list.add(href, term),
        <>
          <Icon className="size-[18px] shrink-0 text-muted-foreground" />
          <span className="truncate">{scope.name}</span>
        </>,
        "h-9",
      ),
    ];
  });
  const categoryChips = scopes.flatMap((scope) => {
    if (scope.type !== "CATEGORY") return [];
    const href = scopeHref(scope.type, scope.id);
    return href ? [chip(list.add(href, term), `${scope.name} · ${format.number(scope.count)}`)] : [];
  });

  const left = (
    <>
      {completionRows.length > 0 && (
        <section>
          {heading(t("searchSuggest.suggestions", "คำแนะนำ"))}
          {completionRows}
        </section>
      )}
      {scopeRows.length > 0 && (
        <section className="pt-1">
          {heading(t("searchSuggest.searchIn", "ค้นหา “{query}” ใน", { query: term }))}
          {scopeRows}
        </section>
      )}
      {categoryChips.length > 0 && (
        <section className="pt-1">
          {heading(t("searchSuggest.categories", "หมวดหมู่"))}
          <div className="flex flex-wrap gap-2 px-1 pt-1">{categoryChips}</div>
        </section>
      )}
    </>
  );

  const productsHeading = heading(
    t("searchSuggest.products", "สินค้าที่ตรงกัน"),
    data && data.totalProducts > 0
      ? row(
          list.add(searchHref(term), term),
          <>
            {t("searchSuggest.viewAll", "ดูทั้งหมด {count}", { count: format.number(data.totalProducts) })}
            <ArrowRightIcon className="size-3.5" />
          </>,
          "h-6 gap-1 px-1 text-xs font-semibold text-primary hover:underline",
        )
      : undefined,
  );

  let right: ReactNode;
  if (waiting) {
    right = (
      <section aria-busy="true">
        {productsHeading}
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-2 py-2" data-testid="suggest-skeleton">
            <Skeleton className="size-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <div className="space-y-2">
              <Skeleton className="ml-auto h-3.5 w-14" />
              <Skeleton className="ml-auto h-3 w-8" />
            </div>
          </div>
        ))}
      </section>
    );
  } else if (failed) {
    right = (
      <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangleIcon className="size-5 text-destructive" />
        </span>
        <p className="font-semibold">{t("searchSuggest.productsFailed", "โหลดสินค้าไม่สำเร็จ")}</p>
        <p className="text-xs text-muted-foreground">
          {t("searchSuggest.productsFailedHint", "ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง")}
        </p>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void suggest.refetch()}
          className="mt-1 h-8 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted"
        >
          {t("searchSuggest.retry", "ลองอีกครั้ง")}
        </button>
      </div>
    );
  } else if (data) {
    const productRows = data.products.map((product) =>
      productRow(list.add(`/products/${encodeURIComponent(product.slug)}`, term), {
        name: product.name,
        subtitle: subtitle(product),
        imageUrl: product.imageUrl,
        lowestPrice: product.lowestPrice,
        sellerCount: product.sellerCount,
      }),
    );
    const shopRows = data.shops.map((shop) => {
      const name = shop.displayName || shop.username;
      return row(
        list.add(`/u/${encodeURIComponent(shop.username)}`, term),
        <>
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {shop.avatarUrl ? (
              <img src={shop.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              name.slice(0, 2).toUpperCase()
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 truncate text-[15px] font-semibold">
              {name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {t("searchSuggest.shopMatches", "{count} สินค้าที่ตรง", { count: shop.matchCount })}
              {shop.ratingAvg != null && shop.ratingCount > 0 && (
                <>
                  {" · ★ "}
                  {t("searchSuggest.shopRating", "{rating} ({count} รีวิว)", {
                    rating: format.number(shop.ratingAvg, { maximumFractionDigits: 1 }),
                    count: shop.ratingCount,
                  })}
                </>
              )}
            </span>
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
        </>,
        "py-2",
      );
    });
    right = (
      <>
        {productRows.length > 0 && (
          <section>
            {productsHeading}
            {productRows}
          </section>
        )}
        {shopRows.length > 0 && (
          <section className="pt-1">
            {heading(t("searchSuggest.shops", "ร้านค้า"))}
            {shopRows}
          </section>
        )}
      </>
    );
  }

  const corrected = data?.correctedQuery ? (
    <p className="border-b border-border bg-primary/5 px-4 py-2 text-sm">
      {t("searchSuggest.corrected", "แสดงผลของ “{corrected}” · คุณพิมพ์ “{query}”", {
        corrected: data.correctedQuery,
        query: term,
      })}
    </p>
  ) : null;

  return {
    options: list.items,
    body: (
      <>
        {corrected}
        {columns(left, right)}
      </>
    ),
    footer: seeAllFooter(t("searchSuggest.seeAll", "ดูผลการค้นหาทั้งหมดของ “{query}”", { query: term })),
    status: data
      ? t("searchSuggest.resultCount", "{count, plural, other {พบสินค้า # รายการ}}", { count: data.totalProducts })
      : waiting
        ? t("searchSuggest.loading", "กำลังค้นหา…")
        : t("searchSuggest.productsFailed", "โหลดสินค้าไม่สำเร็จ"),
  };
}
