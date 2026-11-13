import { isOnSale } from "@/components/sale";
import type { ProductSummaryDto } from "@/features/catalog/catalog.types";

/**
 * ราคาที่โชว์บนการ์ด/แถว [TCG-777]
 * - ราคาที่มีผล: `pricing.salePrice` (SAL-04) ถ้ามี ไม่งั้น `lowestPrice`
 * - ราคาก่อนลด: `lowestRegularPrice` (SRCH-04) หรือ `pricing.listPrice` เมื่อมากกว่าราคาที่มีผล
 */
export function priceOf(product: ProductSummaryDto) {
  const sale = isOnSale(product.pricing) ? product.pricing : null;
  const price = sale ? sale.salePrice : product.lowestPrice;
  const regular = product.lowestRegularPrice ?? sale?.listPrice ?? null;
  const before = price !== null && regular !== null && regular > price ? regular : null;
  const percent =
    sale?.discountPercent ?? (before !== null && price !== null ? Math.round(((before - price) / before) * 100) : null);
  return { price, before, percent: percent && percent > 0 ? percent : null, flash: sale?.sale?.type === "FLASH_SALE" };
}
