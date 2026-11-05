import { PriceTag, isOnSale, type ListingPricing } from "@/components/sale";
import { formatListingPrice } from "@/features/catalog/listing.format";

/**
 * ราคาในแถวประกาศขาย (market listings / product detail) — ลดราคาแสดง PriceTag เล็ก (ราคาลด + -N% + ราคาขีดฆ่า)
 * ไม่ลดคงหน้าตาเดิม
 */
export function ListingRowPrice({ price, pricing }: { price: number; pricing?: ListingPricing | null }) {
  if (!isOnSale(pricing)) {
    return <strong className="text-right text-[15px]">{formatListingPrice(price)}</strong>;
  }
  return <PriceTag pricing={pricing} size="sm" className="items-end text-right" />;
}
