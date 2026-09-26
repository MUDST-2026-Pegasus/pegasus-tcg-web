import { useEffect, useEffectEvent, useState, type FormEvent, type MouseEvent } from "react";
import { SearchIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, QueryBoundary } from "@/components/common";
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

  // ลิงก์ที่มี ?game= หรือ ?category= ต้องรอรายชื่อไปแปลง slug ถ้ารายชื่อโหลดพัง
  // ก็ต้องบอกและให้ลองใหม่ ไม่ใช่ค้างที่ skeleton ตลอดไป
  const lookupFailure =
    filters.games.length > 0 && games.isError
      ? games
      : filters.category !== null && categories.isError
        ? categories
        : null;

  /**
   * เปลี่ยนตัวกรองอะไรก็กลับไปหน้า 1 — ต่อจากตัวกรองใน URL ของ render นี้
   * (ช่องค้นหาที่หน่วงเวลาไว้เรียกผ่าน `commitQuery` จะได้ตัวของ render ล่าสุดเสมอ)
   */
  const update = (patch: Partial<SearchFilters>, options?: { replace?: boolean }) => {
    setParams((current) => writeFilters({ ...readFilters(current), page: 1, ...patch }), options);
  };

  // ช่องค้นหาพิมพ์ได้ทันที แต่เขียนลง URL (และยิง API) หลังหยุดพิมพ์
  const [searchInput, setSearchInput] = useState(filters.q);
  const [lastUrlQuery, setLastUrlQuery] = useState(filters.q);
  if (filters.q !== lastUrlQuery) {
    // q เปลี่ยนจากข้างนอก เช่น กด back — ให้ช่องค้นหาตามไปด้วย
    setLastUrlQuery(filters.q);
    setSearchInput(filters.q);
  }
  // setSearchParams ของ React Router ส่ง params "ของ render ที่สร้างมัน" ให้ callback ไม่ใช่ของล่าสุด
  // timer ที่ถือ update ตัวเก่าไว้จึงเขียนทับ checkbox ที่เพิ่งกดระหว่างรอ — effect event
  // เรียก update ของ render ล่าสุดเสมอ
  const commitQuery = useEffectEvent((next: string) => {
    // replace: ไม่ต้องกด back ย้อนทีละคำที่เคยพิมพ์
    update({ q: next }, { replace: true });
  });
  useEffect(() => {
    const next = searchInput.trim();
    if (next === filters.q) return;
    const timer = window.setTimeout(() => commitQuery(next), TYPING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, filters.q]);

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
    setParams((current) => writeFilters({ ...readFilters(current), page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const pageHref = (page: number) => `?${writeFilters({ ...filters, page })}`;

  const data = results.data;
  const filtered = hasActiveFilters(filters);
  const waiting = !ready || results.isPending;

  // ?page= เกินจำนวนหน้าจริง (ลิงก์เก่า หรือผลลดลงหลังเปลี่ยนตัวกรอง) — พาไปหน้าสุดท้าย
  const lastPage = Math.max(data?.totalPages ?? 1, 1);
  const pageOverflow = data !== undefined && !results.isPlaceholderData && filters.page > lastPage;
  useEffect(() => {
    if (pageOverflow) {
      setParams((current) => writeFilters({ ...readFilters(current), page: lastPage }), { replace: true });
    }
  }, [pageOverflow, lastPage, setParams]);

  const clearFilters = () =>
    setParams((current) => {
      const { q, sort } = readFilters(current);
      return writeFilters({ ...readFilters(new URLSearchParams()), q, sort });
    });

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
            {lookupFailure
              ? ""
              : data && !waiting
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
                onClick={clearFilters}
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

            {lookupFailure ? (
              <ErrorState
                error={lookupFailure.error}
                title="โหลดตัวกรองไม่สำเร็จ"
                onRetry={() => lookupFailure.refetch()}
              />
            ) : !ready ? (
              <ResultsSkeleton />
            ) : (
              <QueryBoundary
                query={results}
                loading={<ResultsSkeleton />}
                errorTitle="ค้นหาไม่สำเร็จ"
                isEmpty={(page) => page.items.length === 0}
                empty={
                  <EmptyState
                    icon={SearchIcon}
                    title={filters.q ? `No products match "${filters.q}"` : "No products found"}
                    description={filtered ? "Try removing a filter or two." : undefined}
                  >
                    {filtered ? (
                      <Button type="button" variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : null}
                  </EmptyState>
                }
              >
                {(page) => (
                  <>
                    <div
                      className={cn(
                        "grid grid-cols-1 gap-[21px] transition-opacity sm:grid-cols-2 xl:grid-cols-4",
                        results.isPlaceholderData && "opacity-60",
                      )}
                      aria-busy={results.isPlaceholderData}
                    >
                      {page.items.map((product) => <SearchProductCard key={product.id} product={product} />)}
                    </div>

                    {page.totalPages > 1 ? (
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
                          {pageWindow(filters.page, page.totalPages).map((number, index) =>
                            number === null ? (
                              <PaginationItem key={`gap-${index}`}><PaginationEllipsis /></PaginationItem>
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
                              href={pageHref(Math.min(page.totalPages, filters.page + 1))}
                              onClick={goToPage(Math.min(page.totalPages, filters.page + 1))}
                              aria-disabled={filters.page >= page.totalPages}
                              className={cn(filters.page >= page.totalPages && "pointer-events-none opacity-50")}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    ) : null}
                  </>
                )}
              </QueryBoundary>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
