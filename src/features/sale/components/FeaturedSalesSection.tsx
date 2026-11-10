import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SaleProductCard, countdownParts, useCountdown } from "@/components/sale";
import { catalogKeys } from "@/features/catalog/catalog.queries";
import { cn } from "@/lib/utils";

import { flashSubtitle, listingCardProps, saleHeadline, saleTerms, untilLabel } from "../sale.format";
import { saleKeys, useFeaturedSales } from "../sale.queries";
import type { FeaturedSales, PublicSale } from "../sale.types";
import { useTranslate } from "@/lib/i18n";

/**
 * Figma SAL-B1 — แถบ Flash Sale + แบนเนอร์ลดทั้งหมวดบนหน้าแรก (`GET /sales/featured`)
 * ไม่มีข้อมูล / โหลดไม่ได้ = ซ่อนทั้งส่วน (ไม่ให้หน้าแรกพังเพราะแคมเปญ)
 */
export function FeaturedSalesSection() {
  const featured = useFeaturedSales();
  if (!featured.data) return null;
  return <FeaturedSales data={featured.data} />;
}

function FeaturedSales({ data }: { data: FeaturedSales }) {
  const flash = data.flashSale;
  const hasFlash = !!flash && flash.listings.length + flash.soldOut.length > 0;
  if (!hasFlash && data.categorySales.length === 0) return null;
  return (
    <div className="grid gap-4 bg-secondary px-4 py-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-[1280px] gap-4">
        {hasFlash && flash ? <FlashSaleStrip flash={flash} /> : null}
        {data.categorySales.length > 0 ? <CategorySaleBanners banners={data.categorySales} /> : null}
      </div>
    </div>
  );
}

function FlashSaleStrip({ flash }: { flash: NonNullable<FeaturedSales["flashSale"]> }) {
  const { t } = useTranslate("sale");
  const { sale, listings, soldOut } = flash;
  const queryClient = useQueryClient();
  const upcoming = sale.status === "SCHEDULED";
  // ถึง 0 → ดึงแถบใหม่ (เริ่มแล้ว / จบแล้ว) และราคาในหน้าอื่น ๆ ที่เปิดค้างไว้
  const left = useCountdown(upcoming ? sale.startsAt : sale.endsAt, () => {
    void queryClient.invalidateQueries({ queryKey: saleKeys.all });
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
  });
  const [hh, mm, ss] = countdownParts(left);
  const href = sale.slug ? `/sale/${sale.slug}` : "/sale";

  return (
    <section aria-label={`Flash Sale ${sale.name}`} className="grid gap-4 rounded-2xl bg-[#fff4ec] p-4 sm:p-5">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="rounded-[10px] bg-linear-to-r from-[#f97316] to-[#dc2626] px-4 py-2 text-lg font-black tracking-wide text-white sm:text-xl">
          ⚡ FLASH SALE
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold">{sale.name}</h2>
          <p className="text-xs text-[#9a3412]">{flashSubtitle(sale)}</p>
        </div>
        <div className="flex items-center gap-1.5" role="timer" aria-live="off" aria-label={upcoming ? t("countdown.startsInAria", "เริ่มใน {time}", { time: `${hh}:${mm}:${ss}` }) : t("countdown.endsInAria", "จบใน {time}", { time: `${hh}:${mm}:${ss}` })}>
          <span className="mr-1 text-xs font-medium">{upcoming ? t("countdown.startsIn", "เริ่มใน") : t("countdown.endsIn", "จบใน")}</span>
          {[hh, mm, ss].map((part, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 ? <span className="font-bold">:</span> : null}
              <span className="grid h-7 min-w-8 place-items-center rounded-md bg-foreground px-1.5 text-sm font-bold text-background tabular-nums">
                {part}
              </span>
            </span>
          ))}
        </div>
        <Link to={href} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-[#c2410c] hover:underline">
          {t("featured.viewAll", "ดูทั้งหมด")} <ArrowRight className="size-4" />
        </Link>
      </header>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1" aria-label={t("featured.listLabel", "สินค้า Flash Sale")}>
        {listings.map((listing) => (
          <SaleProductCard
            key={listing.id}
            {...listingCardProps(listing)}
            upcoming={upcoming}
            className="w-[190px] shrink-0 snap-start sm:w-[225px]"
          />
        ))}
        {/* หมดโควตาแล้ว — ต่อท้ายแบบจาง ๆ (ราคา Flash ตอนขาย ไม่ใช่ราคาตอนนี้) */}
        {soldOut.map((card) => (
          <SaleProductCard
            key={`sold-${card.listing.id}`}
            {...listingCardProps(card.listing)}
            pricing={{
              listPrice: card.listing.price,
              salePrice: card.flashPrice,
              discountPercent: card.discountPercent,
              sale: { id: sale.id, slug: sale.slug, name: sale.name, type: "FLASH_SALE", endsAt: sale.endsAt, quotaLeft: 0, perBuyerLimit: sale.perBuyerLimit },
            }}
            className="w-[190px] shrink-0 snap-start sm:w-[225px]"
          />
        ))}
      </div>
    </section>
  );
}

const BANNER_STYLES = [
  "bg-linear-to-r from-[#0069a8] to-[#073a5c]",
  "bg-linear-to-r from-[#7c3aed] to-[#4c1d95]",
  "bg-linear-to-r from-[#0f766e] to-[#134e4a]",
];

/** แบนเนอร์แคมเปญ CATEGORY_SALE ที่ featured — ใบแรกกว้าง ที่เหลือเล็ก · ลิงก์ไป /sale/{slug} */
function CategorySaleBanners({ banners }: { banners: PublicSale[] }) {
  const { t } = useTranslate("sale");
  return (
    <div className="grid gap-4 md:grid-cols-[2.9fr_1fr]">
      {banners.slice(0, 3).map((sale, index) => {
        const wide = index === 0;
        return (
          <Link
            key={sale.id}
            to={sale.slug ? `/sale/${sale.slug}` : "/sale"}
            className={cn(
              "group relative flex min-h-[124px] items-center gap-4 overflow-hidden rounded-2xl px-6 py-5 text-white focus-visible:outline-2 focus-visible:outline-primary",
              BANNER_STYLES[index % BANNER_STYLES.length],
              !wide && index > 1 && "md:col-start-2",
            )}
          >
            {sale.bannerImageUrl ? (
              <img src={sale.bannerImageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-25" />
            ) : null}
            <div className="relative min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wide uppercase opacity-80">{sale.name}</p>
              <p className={cn("font-black", wide ? "text-2xl" : "text-xl")}>{saleHeadline(sale)}</p>
              <p className="mt-1 truncate text-xs opacity-85">
                {wide ? t("featured.bannerTerms", "ราคาลดแล้วในหน้าสินค้า ไม่ต้องใช้โค้ด · {until} · ใช้โค้ดส่วนลดซ้อนได้", { until: untilLabel(sale.endsAt) }) : `${saleTerms(sale)} · ${untilLabel(sale.endsAt)}`}
              </p>
            </div>
            {wide ? (
              <span className="relative hidden shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#073a5c] group-hover:bg-white/90 sm:inline-flex">
                {t("featured.shopNow", "ช้อปเลย →")}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
