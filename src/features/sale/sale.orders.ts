import type { OrderItemSale } from "@/components/sale";

export type SaleOrderItem = OrderItemSale & { id: number; productName: string; quantity: number; unitPrice: number };

/** แถวที่ได้ราคาลด (มีส่วนลด > 0) */
export function saleItems<T extends SaleOrderItem>(items: T[]): T[] {
  return items.filter((item) => (item.saleDiscount?.platform ?? 0) + (item.saleDiscount?.seller ?? 0) > 0);
}

/** รวมส่วนลดราคาสินค้าของออเดอร์ แยกผู้ออกเงิน */
export function saleDiscountTotals(items: SaleOrderItem[]) {
  return items.reduce(
    (sum, item) => ({
      platform: sum.platform + (item.saleDiscount?.platform ?? 0),
      seller: sum.seller + (item.saleDiscount?.seller ?? 0),
    }),
    { platform: 0, seller: 0 },
  );
}

