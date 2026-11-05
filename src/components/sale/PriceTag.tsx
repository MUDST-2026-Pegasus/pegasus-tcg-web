import { cn } from "@/lib/utils";

import { SaleBadge } from "./SaleBadge";
import { formatSaleBaht, priceTagState } from "./sale.format";
import type { ListingPricing } from "./sale.types";

const SIZE = {
  sm: { price: "text-sm", list: "text-[11px]", gap: "gap-1.5" },
  md: { price: "text-lg leading-6", list: "text-xs", gap: "gap-2" },
  lg: { price: "text-[28px] leading-9", list: "text-sm", gap: "gap-2.5" },
} as const;

/**
 * Figma "SAL / Price Tag" — ราคาที่ผู้ซื้อเห็นทุกจุด
 * Default = ราคาสีหลัก · Sale / Flash = `salePrice` แดง + ป้าย -N% + `listPrice` ขีดฆ่า
 *
 * ทุกตัวเลขมาจาก `pricing` ของ API · ไม่มี `pricing` (API เก่า) แสดง `price` แบบ Default
 */
export function PriceTag({
  pricing,
  price,
  size = "md",
  showBadge = true,
  inline = false,
  className,
}: {
  pricing?: ListingPricing | null;
  /** ราคาเมื่อไม่มี `pricing` */
  price?: number | null;
  size?: keyof typeof SIZE;
  showBadge?: boolean;
  /** ราคาขีดฆ่าอยู่บรรทัดเดียวกับราคาลด (แถวในตะกร้า / ตาราง) */
  inline?: boolean;
  className?: string;
}) {
  const state = priceTagState(pricing);
  const sizes = SIZE[size];

  if (state === "default" || !pricing) {
    const amount = pricing?.salePrice ?? price;
    return (
      <span data-slot="price-tag" data-state="default" className={cn("inline-flex", className)}>
        <span className={cn("font-semibold text-primary", sizes.price)}>
          {amount == null ? "—" : formatSaleBaht(amount)}
        </span>
      </span>
    );
  }

  return (
    <span
      data-slot="price-tag"
      data-state={state}
      className={cn("inline-flex", inline ? "flex-wrap items-baseline gap-x-2" : "flex-col items-start gap-0.5", className)}
    >
      <span className={cn("inline-flex items-center", sizes.gap)}>
        <span className={cn("font-bold text-[#dc2626]", sizes.price)}>{formatSaleBaht(pricing.salePrice)}</span>
        {showBadge ? <SaleBadge type="percent" percent={pricing.discountPercent} /> : null}
      </span>
      <s className={cn("text-muted-foreground", sizes.list)} aria-label={`ราคาปกติ ${formatSaleBaht(pricing.listPrice)}`}>
        {formatSaleBaht(pricing.listPrice)}
      </s>
    </span>
  );
}
