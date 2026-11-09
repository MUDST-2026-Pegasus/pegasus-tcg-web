import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Info, Tag } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/common";
import { SaleProductCard, formatCountdown, useCountdown } from "@/components/sale";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { CONDITION_LABELS } from "@/features/catalog/catalog.mappers";
import { useGameList } from "@/features/catalog/catalog.queries";
import type { CardCondition } from "@/features/catalog/catalog.types";
import { cn } from "@/lib/utils";

import { listingCardProps, saleHeadline, saleTerms } from "../sale.format";
import { SALE_GRID_PAGE_SIZE, useSaleListings, useSales } from "../sale.queries";
import type { PublicSale, SaleListingQuery, SaleSort } from "../sale.types";
import { usePageTitle } from "@/hooks/use-page-title";
import { intlLocale } from "@/lib/i18n";

const SORTS: Array<{ value: SaleSort; label: string }> = [
  { value: "discount_desc", label: "ลดมากสุด" },
  { value: "price_asc", label: "ราคาต่ำสุด" },
  { value: "ending_soon", label: "ใกล้หมดเวลา" },
];

const CONDITIONS = Object.keys(CONDITION_LABELS) as CardCondition[];
/** ค่าแทน "ไม่กรอง" ใน Select — URL ไม่เก็บค่านี้ */
const ALL = "ALL";
const CONDITION_ITEMS = [
  { value: ALL, label: "ทุกสภาพ" },
  ...CONDITIONS.map((code) => ({ value: code, label: CONDITION_LABELS[code] })),
];
const FILTER_TRIGGER = "h-8 rounded-full border-border bg-card text-[13px]";
/** chip กรองแบบกดค้าง — ตอนเลือกเป็นพื้นดำ (Figma SAL-B2) */
const CHIP =
  "h-8 rounded-full bg-card px-3 text-[13px] aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:bg-foreground/90";

/**
 * Figma SAL-B2 — `/sale` (ทุกอย่างที่ลด · `GET /listings?onSale=true`) และ `/sale/:slug` (`GET /sales/{slug}`)
 * filter / sort อยู่ใน URL · ราคาทุกใบมาจาก `pricing` ของ API
 */
export function SalePage() {
  const { slug = null } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const query = useMemo<SaleListingQuery>(
    () => ({
      gameId: Number(params.get("game")) || undefined,
      condition: (params.get("condition") as CardCondition | null) ?? undefined,
      minDiscount: Number(params.get("minDiscount")) || undefined,
      minPrice: Number(params.get("minPrice")) || undefined,
      maxPrice: Number(params.get("maxPrice")) || undefined,
      sort: (params.get("sort") as SaleSort | null) ?? "discount_desc",
    }),
    [params],
  );

  const sales = useSales();
  const listings = useSaleListings(slug, query);
  const games = useGameList();
  const pages = listings.data?.pages ?? [];
  const items = pages.flatMap((page) => page.page.items);
  const total = pages[0]?.page.totalItems ?? 0;
  const sale = pages[0]?.sale ?? null;
  usePageTitle(sale?.name);
  const allCount = (sales.data ?? []).reduce((sum, item) => sum + item.listingCount, 0);
  const gameItems = useMemo(
    () => [{ value: ALL, label: "ทุกเกม" }, ...(games.data ?? []).map((game) => ({ value: String(game.id), label: game.name }))],
    [games.data],
  );

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <main className="mx-auto grid w-full max-w-[1280px] gap-5 px-4 py-6 lg:px-10">
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/" />}>หน้าแรก</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {slug ? <BreadcrumbLink render={<Link to="/sale" />}>SALE</BreadcrumbLink> : <BreadcrumbPage>SALE</BreadcrumbPage>}
          </BreadcrumbItem>
          {slug ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{sale?.name ?? slug}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-3xl font-black text-[#dc2626]">SALE</h1>
        <p className="text-sm text-muted-foreground">ราคาลดแล้วทั้งหมด ไม่ต้องใช้โค้ด</p>
      </header>

      <nav aria-label="แคมเปญลดราคา" className="flex flex-wrap gap-2">
        <TabLink to="/sale" active={!slug}>
          ทั้งหมด {allCount ? allCount.toLocaleString(intlLocale()) : ""}
        </TabLink>
        {(sales.data ?? [])
          .filter((item) => item.slug)
          .map((item) => (
            <TabLink key={item.id} to={`/sale/${item.slug}`} active={slug === item.slug}>
              {item.type === "FLASH_SALE" ? "⚡ " : ""}
              {item.name}
              {item.status === "SCHEDULED" ? " · เร็วๆ นี้" : ""}
            </TabLink>
          ))}
      </nav>

      {sale ? <CampaignHero key={sale.id} sale={sale} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="เกม"
          items={gameItems}
          value={params.get("game") ?? ALL}
          onChange={(value) => setParam("game", value === ALL ? null : value)}
        />
        <FilterSelect
          label="สภาพ"
          items={CONDITION_ITEMS}
          value={params.get("condition") ?? ALL}
          onChange={(value) => setParam("condition", value === ALL ? null : value)}
        />
        {[10, 20].map((value) => (
          <Toggle
            key={value}
            variant="outline"
            size="sm"
            className={CHIP}
            pressed={query.minDiscount === value}
            onPressedChange={(pressed) => setParam("minDiscount", pressed ? String(value) : null)}
          >
            ลด ≥ {value}%
          </Toggle>
        ))}
        <PriceFilter
          min={query.minPrice}
          max={query.maxPrice}
          onApply={(min, max) => {
            const next = new URLSearchParams(params);
            for (const [key, value] of [
              ["minPrice", min],
              ["maxPrice", max],
            ] as const) {
              if (value) next.set(key, String(value));
              else next.delete(key);
            }
            setParams(next, { replace: true });
          }}
        />
        <div className="ml-auto flex items-center gap-2 text-[13px] text-muted-foreground">
          <span aria-hidden>เรียง:</span>
          <Select
            items={SORTS}
            value={query.sort}
            onValueChange={(value) => setParam("sort", !value || value === "discount_desc" ? null : value)}
          >
            <SelectTrigger aria-label="เรียงตาม" size="sm" className="min-w-36 rounded-md border-border bg-card text-[13px] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SORTS.map((sort) => (
                  <SelectItem key={sort.value} value={sort.value}>
                    {sort.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {listings.isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: SALE_GRID_PAGE_SIZE }, (_, index) => (
            <Skeleton key={index} className="h-[300px] rounded-xl" />
          ))}
        </div>
      ) : listings.isError ? (
        <ErrorState
          error={listings.error}
          title="โหลดสินค้าลดราคาไม่สำเร็จ"
          onRetry={() => void listings.refetch()}
          className="min-h-60"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={sale && sale.status !== "ACTIVE" ? "แคมเปญนี้ยังไม่มีสินค้าที่ลดราคา" : "ไม่มีสินค้าที่ตรงกับตัวกรอง"}
          className="min-h-60 border-dashed"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {items.map((listing) => (
            <SaleProductCard key={listing.id} {...listingCardProps(listing)} upcoming={sale?.status === "SCHEDULED"} />
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <p className="text-center text-[13px] text-primary">
          แสดง 1–{items.length.toLocaleString(intlLocale())} จาก {total.toLocaleString(intlLocale())}
          {listings.hasNextPage ? (
            <>
              {" · "}
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-[13px] font-semibold"
                disabled={listings.isFetchingNextPage}
                onClick={() => void listings.fetchNextPage()}
              >
                {listings.isFetchingNextPage ? "กำลังโหลด…" : "โหลดเพิ่ม"}
              </Button>
            </>
          ) : null}
        </p>
      ) : null}
    </main>
  );
}

function TabLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      nativeButton={false}
      render={<Link to={to} aria-current={active ? "page" : undefined} />}
      className={cn(
        "h-8 rounded-full px-3.5 text-[13px] whitespace-nowrap",
        active ? "bg-foreground font-semibold text-background hover:bg-foreground/90" : "bg-card font-normal",
      )}
    >
      {children}
    </Button>
  );
}

/** dropdown กรองของแถบ filter — ค่า `ALL` = ไม่กรอง */
function FilterSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next ?? ALL)}>
      <SelectTrigger aria-label={label} size="sm" className={cn(FILTER_TRIGGER, "min-w-32")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Hero แคมเปญ (Figma SAL-B2) — นับถอยหลังถึงจบ · จบระหว่างเปิดหน้า → แถบแจ้ง + ลิงก์ /sale */
function CampaignHero({ sale }: { sale: PublicSale }) {
  const upcoming = sale.status === "SCHEDULED";
  const [endedLive, setEndedLive] = useState(false);
  const notified = useRef(false);
  const left = useCountdown(upcoming ? sale.startsAt : sale.endsAt, () => {
    if (!upcoming) setEndedLive(true);
  });
  const ended = endedLive || sale.status === "ENDED" || sale.status === "SOLD_OUT" || sale.status === "BUDGET_EXHAUSTED";

  useEffect(() => {
    if (!endedLive || notified.current) return;
    notified.current = true;
    toast.add({ title: `${sale.name} จบแล้ว`, description: "ดูสินค้าลดราคาอื่นได้ที่หน้า SALE", type: "info" });
  }, [endedLive, sale.name]);

  return (
    <>
      {ended ? (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded-xl border border-[#cfe0f7] bg-[#e8f1fc] px-4 py-3 text-sm text-[#0058bc]">
          <Info className="size-4 shrink-0" aria-hidden />
          {sale.name} จบแล้ว · ราคากลับเป็นราคาปกติ
          <Link to="/sale" className="ml-auto font-semibold underline">
            ดูสินค้าลดราคาอื่นที่หน้า SALE
          </Link>
        </div>
      ) : null}
      <section
        aria-label={sale.name}
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-2xl px-6 py-6 text-white sm:px-7",
          sale.type === "FLASH_SALE" ? "bg-linear-to-r from-[#f97316] to-[#dc2626]" : "bg-linear-to-r from-[#0069a8] to-[#073a5c]",
          ended && "opacity-60 grayscale",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
            {sale.name} · {sale.type === "SHOP_SALE" ? "ร้านค้า" : "แคมเปญ Pegasus"}
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">{saleHeadline(sale)}</h2>
          <p className="mt-1 text-xs opacity-85">{saleTerms(sale)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">{ended ? "สถานะ" : upcoming ? "เริ่มในอีก" : "เหลืออีก"}</p>
          <p className="text-2xl font-black tabular-nums">{ended ? "จบแล้ว" : formatCountdown(left)}</p>
          <p className="text-xs opacity-80">
            {sale.listingCount.toLocaleString(intlLocale())} listing{sale.shop ? ` · ร้าน ${sale.shop.displayName ?? sale.shop.username}` : ""}
          </p>
        </div>
      </section>
    </>
  );
}

function PriceFilter({
  min,
  max,
  onApply,
}: {
  min?: number;
  max?: number;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(min ? String(min) : "");
  const [to, setTo] = useState(max ? String(max) : "");
  const active = min != null || max != null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" className={CHIP} aria-pressed={active} />}>
        ราคา{active ? `: ${min ?? 0}–${max ?? "∞"}` : ""}
        <ChevronDown data-icon="inline-end" />
      </PopoverTrigger>
      <PopoverContent align="start" className="grid w-64 gap-3 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Input aria-label="ราคาต่ำสุด" type="number" min={0} placeholder="ต่ำสุด" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input aria-label="ราคาสูงสุด" type="number" min={0} placeholder="สูงสุด" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFrom("");
              setTo("");
              onApply(null, null);
              setOpen(false);
            }}
          >
            ล้าง
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onApply(Number(from) || null, Number(to) || null);
              setOpen(false);
            }}
          >
            ใช้
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
