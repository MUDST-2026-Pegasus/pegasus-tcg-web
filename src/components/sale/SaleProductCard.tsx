import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { PriceTag } from "./PriceTag";
import { SaleBadge } from "./SaleBadge";
import { priceTagState, quotaProgress } from "./sale.format";
import type { ListingPricing } from "./sale.types";

export type SaleProductCardProps = {
  title: string;
  /** ป้ายชนิดสินค้า เช่น "Single Card" */
  type?: string;
  image?: string | null;
  imageAlt?: string;
  href: string;
  pricing?: ListingPricing | null;
  /** ราคาเมื่อไม่มี `pricing` */
  price?: number | null;
  /** โควตาทั้งหมดของ listing ในแคมเปญ Flash — ไม่รู้ก็แสดงแค่ "เหลือ N ชิ้น" */
  quota?: number | null;
  /** แคมเปญ Flash ยังไม่เริ่ม (≤ 24 ชม.) — ราคาปกติ + ป้าย "เร็วๆ นี้" */
  upcoming?: boolean;
  className?: string;
};

/**
 * Figma "SAL / Sale Product Card" — การ์ดสินค้าแบบ Card-first + ราคาลด
 * Sale = ป้าย -N% บนรูป · Flash = ป้าย FLASH SALE + แถบโควตา (`quotaLeft`)
 * โควตาหมด → จาง + "หมดแล้ว" แต่ยังกดเข้า listing ได้ (ราคาปกติ)
 */
export function SaleProductCard({
  title,
  type,
  image,
  imageAlt,
  href,
  pricing,
  price,
  quota,
  upcoming = false,
  className,
}: SaleProductCardProps) {
  const sale = pricing?.sale ?? null;
  const flashSale = sale?.type === "FLASH_SALE";
  const soldOut = flashSale && sale.quotaLeft != null && sale.quotaLeft <= 0;
  // โควตาหมดแล้ว / ยังไม่เริ่ม → ผู้ซื้อจ่ายราคาปกติ
  const shownPricing = soldOut || upcoming ? null : pricing;
  const shownPrice = soldOut || upcoming ? (pricing?.listPrice ?? price) : price;
  const state = priceTagState(shownPricing);
  const progress = flashSale && !upcoming ? quotaProgress(quota, sale.quotaLeft) : null;

  return (
    <Link
      to={href}
      data-slot="sale-product-card"
      data-state={soldOut ? "sold-out" : upcoming ? "upcoming" : state}
      className={cn("group block min-w-0 rounded-[12px] focus-visible:outline-2 focus-visible:outline-primary", className)}
    >
      <Card
        className={cn(
          "h-full gap-3.5 rounded-[12px] py-4 shadow-none ring-1 ring-foreground/5 transition-shadow group-hover:shadow-md",
          soldOut && "opacity-55",
        )}
      >
        <div className="relative px-5">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
            {image ? <img src={image} alt={imageAlt ?? title} className="size-full object-contain" loading="lazy" /> : null}
          </div>
          {soldOut ? (
            <SaleBadge type="percent" label="หมดแล้ว" className="absolute top-2 left-7 bg-foreground" />
          ) : upcoming ? (
            <SaleBadge type="flash" label="⚡ เร็วๆ นี้" className="absolute top-2 left-7" />
          ) : state === "flash" ? (
            <SaleBadge type="flash" className="absolute top-2 left-7" />
          ) : state === "sale" && shownPricing ? (
            <SaleBadge type="percent" percent={shownPricing.discountPercent} className="absolute top-2 left-7" />
          ) : null}
        </div>
        <div className="grid gap-2.5 px-5">
          {type ? (
            <span className="w-fit rounded-full bg-secondary px-2 py-0.5 text-[10px] leading-[14px] font-medium text-secondary-foreground">
              {type}
            </span>
          ) : null}
          <p className="line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-card-foreground">{title}</p>
        </div>
        <div className="mt-auto grid gap-1.5 px-5">
          <PriceTag pricing={shownPricing} price={shownPrice} />
          {flashSale && !upcoming ? (
            <div className="grid gap-1">
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#fde2d4]" aria-hidden>
                <div className="h-full rounded-[3px] bg-[#ea580c]" style={{ width: `${soldOut ? 100 : (progress?.percent ?? 0)}%` }} />
              </div>
              <p className="text-[11px] font-medium text-[#c2410c]">
                {soldOut
                  ? "ราคา Flash หมดแล้ว"
                  : progress
                    ? `ขายแล้ว ${progress.sold}/${progress.quota} · เหลือ ${progress.left} ชิ้น`
                    : sale.quotaLeft != null
                      ? `เหลือ ${sale.quotaLeft} ชิ้น`
                      : "จำนวนจำกัด"}
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
