import { StoreIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { SaleBadge } from "@/components/sale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel, formatPrice, productHref } from "@/features/catalog/catalog.mappers";
import type { CategoryDto, GameDto, ProductSummaryDto } from "@/features/catalog/catalog.types";
import { priceOf } from "@/features/catalog/search/search-result.format";
import { useTranslate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type ResultContext = {
  games: GameDto[] | undefined;
  categories: CategoryDto[] | undefined;
};

function kicker(product: ProductSummaryDto, context: ResultContext) {
  const game = context.games?.find((item) => item.id === product.gameId)?.name;
  const category = context.categories?.find((item) => item.id === product.categoryId);
  return [game, category ? categoryLabel(category) : null].filter(Boolean).join(" · ");
}

function Discount({ percent, flash, className }: { percent: number | null; flash: boolean; className?: string }) {
  if (percent === null && !flash) return null;
  return <SaleBadge type={flash ? "flash" : "percent"} percent={percent} className={className} />;
}

/** การ์ดในมุมมอง grid — Figma "Result Card" 3053-15265 */
export function SearchResultCard({ product, context }: { product: ProductSummaryDto; context: ResultContext }) {
  const { t } = useTranslate("buyer");
  const { price, before, percent, flash } = priceOf(product);
  const soldOut = price === null;
  const sellers = product.sellerCount ?? 0;

  return (
    <Link
      to={productHref(product.slug)}
      aria-label={t("search.productAria", "{name} ราคา {price}", { name: product.name, price: formatPrice(price) })}
      data-testid="search-result-card"
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[4/3.5] bg-muted">
        {product.primaryImageUrl ? (
          <img
            src={product.primaryImageUrl}
            alt=""
            loading="lazy"
            className={cn("size-full object-contain p-2", soldOut && "opacity-40 grayscale")}
          />
        ) : null}
        <Discount percent={percent} flash={flash} className="absolute top-2 left-2" />
        {soldOut ? (
          <span className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-background">
            {t("search.card.soldOut", "สินค้าหมด")}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <p className="truncate text-xs text-muted-foreground">{kicker(product, context)}</p>
        <h3 className="line-clamp-2 min-h-[2lh] text-sm leading-5 font-semibold text-foreground sm:text-[15px]">
          {product.name}
        </h3>
        {product.cardNumber ? (
          <p className="truncate text-xs text-muted-foreground">{product.cardNumber}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            {soldOut ? (
              <p className="text-sm font-semibold text-muted-foreground">{t("search.card.soldOut", "สินค้าหมด")}</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{t("search.card.from", "เริ่มต้น")}</p>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-base font-bold whitespace-nowrap text-primary sm:text-xl">{formatPrice(price)}</span>
                  {before !== null ? (
                    <span className="text-xs text-muted-foreground line-through">{formatPrice(before)}</span>
                  ) : null}
                </p>
              </>
            )}
          </div>
          {sellers > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <StoreIcon className="size-3.5" aria-hidden="true" />
              {t("search.card.sellers", "{count} ร้าน", { count: sellers })}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/** แถวในมุมมอง list — Figma "Result Row" 3057-16187 */
export function SearchResultRow({ product, context }: { product: ProductSummaryDto; context: ResultContext }) {
  const { t } = useTranslate("buyer");
  const { price, before, percent, flash } = priceOf(product);
  const soldOut = price === null;
  const sellers = product.sellerCount ?? 0;
  const high = product.highestPrice ?? null;

  return (
    <div
      data-testid="search-result-row"
      className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[72px_minmax(0,1fr)_180px_auto] sm:items-center sm:gap-4 sm:p-4"
    >
      <Link to={productHref(product.slug)} className="block aspect-square overflow-hidden rounded-lg bg-muted" tabIndex={-1} aria-hidden="true">
        {product.primaryImageUrl ? (
          <img src={product.primaryImageUrl} alt="" loading="lazy" className={cn("size-full object-contain", soldOut && "opacity-40 grayscale")} />
        ) : null}
      </Link>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{kicker(product, context)}</p>
        <Link to={productHref(product.slug)} className="line-clamp-2 font-semibold hover:underline sm:text-[17px]">
          {product.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {product.cardNumber ? <span>{product.cardNumber}</span> : null}
          <Discount percent={percent} flash={flash} />
        </div>
      </div>
      <div className="col-start-2 text-xs text-muted-foreground sm:col-start-auto">
        <p>{t("search.row.sellingShops", "ร้านที่ขาย")}</p>
        <p className="text-sm font-medium text-foreground">
          {t("search.row.shopsAndListings", "{shops} ร้าน · {listings} รายการ", {
            shops: sellers,
            listings: product.listingCount,
          })}
        </p>
        {!soldOut && high !== null && high > (price ?? 0) ? (
          <p>
            {formatPrice(price)} – {formatPrice(high)}
          </p>
        ) : null}
      </div>
      <div className="col-start-2 flex items-center justify-between gap-4 sm:col-start-auto sm:justify-end">
        <div className="sm:text-right">
          {soldOut ? (
            <p className="text-sm font-semibold text-muted-foreground">{t("search.card.soldOut", "สินค้าหมด")}</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{t("search.card.from", "เริ่มต้น")}</p>
              <p className="text-xl font-bold text-primary">{formatPrice(price)}</p>
              {before !== null ? <p className="text-xs text-muted-foreground line-through">{formatPrice(before)}</p> : null}
            </>
          )}
        </div>
        <Button size="sm" nativeButton={false} render={<Link to={`${productHref(product.slug)}/listings`} />}>
          {t("search.row.viewListings", "ดูรายการขาย")}
        </Button>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ view, count = 12 }: { view: "grid" | "list"; count?: number }) {
  if (view === "list") {
    return (
      <div aria-hidden="true" className="flex flex-col gap-3" data-testid="search-skeleton">
        {Array.from({ length: Math.min(count, 6) }, (_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
            <Skeleton className="size-[72px] rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" data-testid="search-skeleton">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border bg-background">
          <Skeleton className="aspect-[4/3.5] w-full rounded-none" />
          <div className="space-y-2 p-3.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="mt-4 h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
