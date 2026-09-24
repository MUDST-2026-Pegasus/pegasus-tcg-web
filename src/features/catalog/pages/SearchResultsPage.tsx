import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { SearchIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CONDITION_LABELS,
  PRODUCT_TYPE_LABELS,
  formatPrice,
  productHref,
} from "@/features/catalog/catalog.mappers";
import {
  useCategoryList,
  useGameList,
  useProductSearch,
} from "@/features/catalog/catalog.queries";
import type {
  CardCondition,
  CategoryDto,
  ProductSummaryDto,
} from "@/features/catalog/catalog.types";
import {
  SEARCH_CONDITIONS,
  SEARCH_SORTS,
  hasActiveFilters,
  pageWindow,
  readFilters,
  toProductQuery,
  writeFilters,
  type SearchFilters,
  type SearchSort,
} from "@/features/catalog/search.params";
import { cn } from "@/lib/utils";

const TYPING_DELAY_MS = 300;
const ALL_CATEGORIES = "all";

function SearchProductCard({ product }: { product: ProductSummaryDto }) {
  const price = formatPrice(product.lowestPrice);

  return (
    <Link
      to={productHref(product.slug)}
      aria-label={`${product.name} ราคา ${price}`}
      className="block rounded-[11px] outline-none transition-[filter] hover:drop-shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-[231px] gap-3 rounded-[11px] py-[15px] shadow-none ring-1 ring-foreground/5">
        <CardContent className="px-[19px]">
          <div className="h-[92px] overflow-hidden rounded-lg bg-muted">
            {product.primaryImageUrl ? (
              <img
                src={product.primaryImageUrl}
                alt={product.name}
                loading="lazy"
                className="size-full object-contain"
              />
            ) : null}
          </div>
        </CardContent>
        <CardHeader className="gap-2 px-[19px]">
          <Badge variant="secondary" className="h-4 rounded-full px-2 text-[9px]">
            {PRODUCT_TYPE_LABELS[product.productType] ?? "Other"}
          </Badge>
          <CardTitle className="line-clamp-2 h-[37px] text-xs leading-[18px] font-semibold">
            {product.name}
          </CardTitle>
        </CardHeader>
        <CardFooter className="mt-auto px-[19px]">
          <p
            className={cn(
              "text-base leading-[22px] font-semibold",
              product.lowestPrice === null ? "text-muted-foreground" : "text-primary",
            )}
          >
            {price}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}

function ResultsSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-[21px] sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-[231px] rounded-[11px] bg-background p-[19px] ring-1 ring-foreground/5">
          <Skeleton className="h-[92px] w-full rounded-lg" />
          <Skeleton className="mt-3 h-4 w-16 rounded-full" />
          <Skeleton className="mt-2 h-[37px] w-4/5" />
          <Skeleton className="mt-3 h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

/** หมวดย่อยเรียงต่อจากหมวดแม่ แสดงเยื้องเข้าไป */
function orderedCategories(categories: CategoryDto[]): { category: CategoryDto; child: boolean }[] {
  const parents = categories.filter((category) => category.parentId === null);
  return parents.flatMap((parent) => [
    { category: parent, child: false },
    ...categories
      .filter((category) => category.parentId === parent.id)
      .map((category) => ({ category, child: true })),
  ]);
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);

  const games = useGameList();
  const categories = useCategoryList();
  const { query, ready } = toProductQuery(filters, games.data, categories.data);
  const results = useProductSearch(query, ready);

  /** เปลี่ยนตัวกรองอะไรก็กลับไปหน้า 1 ยกเว้นตอนเปลี่ยนหน้าเอง */
  const update = (patch: Partial<SearchFilters>) => {
    setParams(writeFilters({ ...filters, page: 1, ...patch }));
  };

  // ช่องค้นหาพิมพ์ได้ทันที แต่เขียนลง URL (และยิง API) หลังหยุดพิมพ์
  const [searchInput, setSearchInput] = useState(filters.q);
  const [lastUrlQuery, setLastUrlQuery] = useState(filters.q);
  if (filters.q !== lastUrlQuery) {
    // q เปลี่ยนจากข้างนอก เช่น กด back — ให้ช่องค้นหาตามไปด้วย
    setLastUrlQuery(filters.q);
    setSearchInput(filters.q);
  }
  useEffect(() => {
    const next = searchInput.trim();
    if (next === filters.q) return;
    const timer = window.setTimeout(() => update({ q: next }), TYPING_DELAY_MS);
    return () => window.clearTimeout(timer);
    // update เปลี่ยนทุก render; ยิงใหม่เฉพาะตอนข้อความเปลี่ยนก็พอ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [minimumPrice, setMinimumPrice] = useState(filters.minPrice);
  const [maximumPrice, setMaximumPrice] = useState(filters.maxPrice);
  const [appliedPrices, setAppliedPrices] = useState(`${filters.minPrice}-${filters.maxPrice}`);
  if (`${filters.minPrice}-${filters.maxPrice}` !== appliedPrices) {
    setAppliedPrices(`${filters.minPrice}-${filters.maxPrice}`);
    setMinimumPrice(filters.minPrice);
    setMaximumPrice(filters.maxPrice);
  }
  const priceRangeInvalid =
    minimumPrice !== "" && maximumPrice !== "" && Number(minimumPrice) > Number(maximumPrice);

  const applyPrice = (event: FormEvent) => {
    event.preventDefault();
    if (priceRangeInvalid) return;
    update({ minPrice: minimumPrice.trim(), maxPrice: maximumPrice.trim() });
  };

  const goToPage = (page: number) => (event: MouseEvent) => {
    event.preventDefault();
    setParams(writeFilters({ ...filters, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const pageHref = (page: number) => `?${writeFilters({ ...filters, page })}`;

  const data = results.data;
  const totalPages = data?.totalPages ?? 0;
  const filtered = hasActiveFilters(filters);
  const waiting = !ready || results.isPending;

  return (
    <div className="min-h-[783px] bg-muted font-sans">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[21px] px-[21px] pt-8 pb-14">
        <Breadcrumb>
          <BreadcrumbList className="text-[12px]">
            <BreadcrumbItem><BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Search Results</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-col gap-[7px] border-b border-border pb-[22px]">
          <h1 className="text-[32px] leading-[39px] font-bold tracking-[-0.02em] text-foreground">
            {filters.q ? <>Search results for &quot;{filters.q}&quot;</> : "All products"}
          </h1>
          <p className="text-[12px] leading-[18px] text-muted-foreground" aria-live="polite">
            {data && !waiting
              ? `${data.totalItems.toLocaleString("en-US")} ${data.totalItems === 1 ? "result" : "results"}`
              : "Searching…"}
          </p>
        </header>

        <div className="grid items-start gap-[28px] pt-[7px] lg:grid-cols-[228px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-[28px]" aria-label="Search filters">
            <FieldSet>
              <FieldLegend className="text-lg font-semibold">Game</FieldLegend>
              <div className="flex flex-col gap-3">
                {games.isPending ? (
                  Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-5 w-40" />)
                ) : games.isError ? (
                  <p className="text-sm text-muted-foreground">โหลดรายชื่อเกมไม่สำเร็จ</p>
                ) : (
                  games.data.map((game) => {
                    const id = `game-${game.slug}`;
                    return (
                      <Field key={game.id} orientation="horizontal">
                        <Checkbox
                          id={id}
                          checked={filters.games.includes(game.slug)}
                          onCheckedChange={() => update({ games: toggle(filters.games, game.slug) })}
                          className="rounded-none"
                        />
                        <FieldLabel htmlFor={id} className="font-normal text-muted-foreground">{game.name}</FieldLabel>
                      </Field>
                    );
                  })
                )}
              </div>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend className="text-lg font-semibold">Category</FieldLegend>
              {categories.isPending ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-5 w-32" />)}
                </div>
              ) : categories.isError ? (
                <p className="text-sm text-muted-foreground">โหลดหมวดหมู่ไม่สำเร็จ</p>
              ) : (
                <RadioGroup
                  value={filters.category ?? ALL_CATEGORIES}
                  onValueChange={(value) =>
                    update({ category: value === ALL_CATEGORIES ? null : String(value) })
                  }
                >
                  <Field orientation="horizontal">
                    <RadioGroupItem id="category-all" value={ALL_CATEGORIES} />
                    <FieldLabel htmlFor="category-all" className="font-normal text-muted-foreground">All categories</FieldLabel>
                  </Field>
                  {orderedCategories(categories.data).map(({ category, child }) => {
                    const id = `category-${category.slug}`;
                    return (
                      <Field key={category.id} orientation="horizontal" className={cn(child && "pl-5")}>
                        <RadioGroupItem id={id} value={category.slug} />
                        <FieldLabel htmlFor={id} className="font-normal text-muted-foreground">{category.name}</FieldLabel>
                      </Field>
                    );
                  })}
                </RadioGroup>
              )}
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend className="text-lg font-semibold">Price Range</FieldLegend>
              <form onSubmit={applyPrice} className="flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <Input type="number" inputMode="numeric" min="0" aria-label="Minimum price" placeholder="฿ Min" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} className="rounded-none border-border bg-background" />
                  <span className="text-muted-foreground">-</span>
                  <Input type="number" inputMode="numeric" min="0" aria-label="Maximum price" placeholder="฿ Max" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} className="rounded-none border-border bg-background" />
                </div>
                {priceRangeInvalid ? (
                  <p role="alert" className="text-xs text-destructive">ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด</p>
                ) : null}
                <Button type="submit" className="w-full rounded-md" disabled={priceRangeInvalid}>Apply Filter</Button>
              </form>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend className="text-lg font-semibold">Condition</FieldLegend>
              <div className="flex flex-col gap-3">
                {SEARCH_CONDITIONS.map((condition: CardCondition) => {
                  const id = `condition-${condition.toLowerCase()}`;
                  return (
                    <Field key={condition} orientation="horizontal">
                      <Checkbox
                        id={id}
                        checked={filters.conditions.includes(condition)}
                        onCheckedChange={() => update({ conditions: toggle(filters.conditions, condition) })}
                        className="rounded-none"
                      />
                      <FieldLabel htmlFor={id} className="font-normal text-muted-foreground">
                        {CONDITION_LABELS[condition]} ({condition})
                      </FieldLabel>
                    </Field>
                  );
                })}
              </div>
            </FieldSet>

            <Separator />

            <Field orientation="horizontal">
              <Checkbox
                id="in-stock"
                checked={filters.inStock}
                onCheckedChange={() => update({ inStock: !filters.inStock })}
                className="rounded-none"
              />
              <FieldLabel htmlFor="in-stock" className="font-normal text-muted-foreground">In stock only</FieldLabel>
            </Field>

            {filtered ? (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-md"
                onClick={() => setParams(writeFilters({ ...readFilters(new URLSearchParams()), q: filters.q, sort: filters.sort }))}
              >
                Clear filters
              </Button>
            ) : null}
          </aside>

          <section className="min-w-0" aria-label="Search results">
            <div className="mb-[21px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-[341px]">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  aria-label="Search products"
                  placeholder="Search cards, sets or card numbers"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="rounded-md border-border bg-background pl-10"
                />
              </div>
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <span>Sort by:</span>
                <Select
                  value={filters.sort}
                  onValueChange={(value) => update({ sort: (value ?? "featured") as SearchSort })}
                  items={SEARCH_SORTS}
                >
                  <SelectTrigger className="w-48 rounded-md border-border bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SEARCH_SORTS.map((sort) => (
                        <SelectItem key={sort.value} value={sort.value}>{sort.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {waiting ? (
              <ResultsSkeleton />
            ) : results.isError ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background p-8 text-center">
                <p role="alert" className="text-muted-foreground">ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง</p>
                <Button type="button" variant="outline" onClick={() => results.refetch()}>ลองอีกครั้ง</Button>
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <div
                  className={cn(
                    "grid grid-cols-1 gap-[21px] transition-opacity sm:grid-cols-2 xl:grid-cols-4",
                    results.isPlaceholderData && "opacity-60",
                  )}
                  aria-busy={results.isPlaceholderData}
                >
                  {data.items.map((product) => <SearchProductCard key={product.id} product={product} />)}
                </div>

                {totalPages > 1 ? (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href={pageHref(Math.max(1, filters.page - 1))}
                          onClick={goToPage(Math.max(1, filters.page - 1))}
                          aria-disabled={filters.page <= 1}
                          className={cn(filters.page <= 1 && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                      {pageWindow(filters.page, totalPages).map((page, index) =>
                        page === null ? (
                          <PaginationItem key={`gap-${index}`}><PaginationEllipsis /></PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink href={pageHref(page)} onClick={goToPage(page)} isActive={page === filters.page}>
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href={pageHref(Math.min(totalPages, filters.page + 1))}
                          onClick={goToPage(Math.min(totalPages, filters.page + 1))}
                          aria-disabled={filters.page >= totalPages}
                          className={cn(filters.page >= totalPages && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                ) : null}
              </>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background p-8 text-center text-muted-foreground">
                <p>No products match{filters.q ? ` "${filters.q}"` : ""}{filtered ? " with these filters" : ""}.</p>
                {filtered ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setParams(writeFilters({ ...readFilters(new URLSearchParams()), q: filters.q }))}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
