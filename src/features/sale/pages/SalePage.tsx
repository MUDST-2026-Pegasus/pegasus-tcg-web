import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";

import { SaleProductCard, formatCountdown, useCountdown } from "@/components/sale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { CONDITION_LABELS } from "@/features/catalog/catalog.mappers";
import { useCategoryList } from "@/features/catalog/catalog.queries";
import type { CardCondition } from "@/features/catalog/catalog.types";
import { cn } from "@/lib/utils";

import { listingCardProps, saleHeadline, saleTerms } from "../sale.format";
import { SALE_GRID_PAGE_SIZE, useSaleListings, useSales } from "../sale.queries";
import type { PublicSale, SaleListingQuery, SaleSort } from "../sale.types";

const SORTS: Array<{ value: SaleSort; label: string }> = [
  { value: "discount_desc", label: "ลดมากสุด" },
  { value: "price_asc", label: "ราคาต่ำสุด" },
  { value: "ending_soon", label: "ใกล้หมดเวลา" },
];

const CONDITIONS = Object.keys(CONDITION_LABELS) as CardCondition[];
const CHIP =
  "inline-flex h-8 items-center gap-1 rounded-full border bg-card px-3 text-[13px] text-foreground aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background";

/**
 * Figma SAL-B2 — `/sale` (ทุกอย่างที่ลด · `GET /search?onSale=true`) และ `/sale/:slug` (`GET /sales/{slug}`)
 * filter / sort อยู่ใน URL · ราคาทุกใบมาจาก `pricing` ของ API
 */
export function SalePage() {
  const { slug = null } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const shopOnly = !slug && params.get("tab") === "shop";
  const query = useMemo<SaleListingQuery>(
    () => ({
      categoryId: Number(params.get("category")) || undefined,
      condition: params.get("condition") ? [params.get("condition") as CardCondition] : undefined,
      minDiscount: Number(params.get("minDiscount")) || undefined,
      minPrice: Number(params.get("minPrice")) || undefined,
      maxPrice: Number(params.get("maxPrice")) || undefined,
      sort: (params.get("sort") as SaleSort | null) ?? "discount_desc",
      owner: shopOnly ? "SELLER" : undefined,
    }),
    [params, shopOnly],
  );

  const sales = useSales();
  const listings = useSaleListings(slug, query);
  const categories = useCategoryList();
  const pages = listings.data?.pages ?? [];
  const items = pages.flatMap((page) => page.page.items);
  const total = pages[0]?.page.totalItems ?? 0;
  const sale = pages[0]?.sale ?? null;
  const allCount = (sales.data ?? []).reduce((sum, item) => sum + item.listingCount, 0);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <main className="mx-auto grid w-full max-w-[1280px] gap-5 px-4 py-6 lg:px-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">
          หน้าแรก
        </Link>
        <span>/</span>
        {slug ? (
          <Link to="/sale" className="hover:underline">
            SALE
          </Link>
        ) : (
          <span>SALE</span>
        )}
        {slug ? (
          <>
            <span>/</span>
            <span>{sale?.name ?? slug}</span>
          </>
        ) : null}
      </nav>

      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-3xl font-black text-[#dc2626]">SALE</h1>
        <p className="text-sm text-muted-foreground">ราคาลดแล้วทั้งหมด ไม่ต้องใช้โค้ด</p>
      </header>

      <nav aria-label="แคมเปญลดราคา" className="flex flex-wrap gap-2">
        <TabLink to="/sale" active={!slug && !shopOnly}>
          ทั้งหมด {allCount ? allCount.toLocaleString("th-TH") : ""}
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
        <TabLink to="/sale?tab=shop" active={shopOnly}>
          ร้านลดราคา
        </TabLink>
      </nav>

      {sale ? <CampaignHero key={sale.id} sale={sale} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          aria-label="หมวดหมู่"
          className="h-8 rounded-full text-[13px]"
          value={params.get("category") ?? ""}
          onChange={(event) => setParam("category", event.target.value || null)}
        >
          <NativeSelectOption value="">หมวดหมู่</NativeSelectOption>
          {(categories.data ?? []).map((category) => (
            <NativeSelectOption key={category.id} value={String(category.id)}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="สภาพ"
          className="h-8 rounded-full text-[13px]"
          value={params.get("condition") ?? ""}
          onChange={(event) => setParam("condition", event.target.value || null)}
        >
          <NativeSelectOption value="">สภาพ</NativeSelectOption>
          {CONDITIONS.map((code) => (
            <NativeSelectOption key={code} value={code}>
              {CONDITION_LABELS[code]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {[10, 20].map((value) => (
          <button
            key={value}
            type="button"
            className={CHIP}
            aria-pressed={query.minDiscount === value}
            onClick={() => setParam("minDiscount", query.minDiscount === value ? null : String(value))}
          >
            ลด ≥ {value}%
          </button>
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
        <label className="ml-auto flex items-center gap-2 text-[13px] text-muted-foreground">
          เรียง:
          <NativeSelect
            aria-label="เรียงตาม"
            className="h-8 rounded-md text-[13px] text-foreground"
            value={query.sort}
            onChange={(event) => setParam("sort", event.target.value === "discount_desc" ? null : event.target.value)}
          >
            {SORTS.map((sort) => (
              <NativeSelectOption key={sort.value} value={sort.value}>
                {sort.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>

      {listings.isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: SALE_GRID_PAGE_SIZE }, (_, index) => (
            <Skeleton key={index} className="h-[300px] rounded-xl" />
          ))}
        </div>
      ) : listings.isError ? (
        <div role="alert" className="grid justify-items-center gap-3 rounded-xl border border-dashed p-10 text-sm">
          โหลดสินค้าลดราคาไม่สำเร็จ
          <Button variant="outline" onClick={() => void listings.refetch()}>
            ลองใหม่
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {sale && sale.status !== "ACTIVE" ? "แคมเปญนี้ยังไม่มีสินค้าที่ลดราคา" : "ไม่มีสินค้าที่ตรงกับตัวกรอง"}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {items.map((listing) => (
            <SaleProductCard key={listing.id} {...listingCardProps(listing)} upcoming={sale?.status === "SCHEDULED"} />
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <p className="text-center text-[13px] text-primary">
          แสดง 1–{items.length.toLocaleString("th-TH")} จาก {total.toLocaleString("th-TH")}
          {listings.hasNextPage ? (
            <>
              {" · "}
              <button
                type="button"
                className="font-semibold hover:underline disabled:opacity-60"
                disabled={listings.isFetchingNextPage}
                onClick={() => void listings.fetchNextPage()}
              >
                {listings.isFetchingNextPage ? "กำลังโหลด…" : "โหลดเพิ่ม"}
              </button>
            </>
          ) : null}
        </p>
      ) : null}
    </main>
  );
}

function TabLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center rounded-full border bg-card px-3.5 text-[13px] whitespace-nowrap",
        active && "border-foreground bg-foreground font-semibold text-background",
      )}
    >
      {children}
    </Link>
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
            {sale.listingCount.toLocaleString("th-TH")} listing จาก {sale.sellerCount.toLocaleString("th-TH")} ร้าน
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
      <PopoverTrigger render={<button type="button" className={CHIP} aria-pressed={active} />}>
        ราคา{active ? `: ${min ?? 0}–${max ?? "∞"}` : ""} ▾
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
