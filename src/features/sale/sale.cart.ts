import { isOnSale } from "@/components/sale";
import type { CartItemResponse } from "@/features/cart/cart.types";

/** ราคาต่อชิ้นที่ตะกร้าคิดตอนนี้ (มาจาก API) */
export function cartUnitPrice(item: Pick<CartItemResponse, "currentPrice" | "unitPriceAtAdd">): number {
  return item.currentPrice ?? item.unitPriceAtAdd;
}

export function cartLineTotals(item: CartItemResponse) {
  const listTotal = (isOnSale(item.pricing) ? item.pricing.listPrice : cartUnitPrice(item)) * item.quantity;
  const eligible = isOnSale(item.pricing) ? Math.min(item.quantity, Math.max(0, item.pricing.sale.perBuyerLimit ?? item.quantity)) : 0;
  const saleDiscount = isOnSale(item.pricing) ? (item.pricing.listPrice - item.pricing.salePrice) * eligible : 0;
  return { listTotal, saleDiscount, subtotal: listTotal - saleDiscount };
}
export function cartSaleTotals(items: CartItemResponse[]) {
  return items.reduce((total, item) => {
    const line = cartLineTotals(item);
    return { listTotal: total.listTotal + line.listTotal, saleDiscount: total.saleDiscount + line.saleDiscount, subtotal: total.subtotal + line.subtotal };
  }, { listTotal: 0, saleDiscount: 0, subtotal: 0 });
}

/**
 * ราคาขึ้นเพราะราคาลดจบ/โควตาหมด (priceChanged ของ TCG-513)
 * ต้องมี `pricing` จาก API (null = ไม่มีการลดแล้ว) — API เก่าไม่ส่ง `pricing` ถือว่าเป็นการเปลี่ยนราคาทั่วไป
 */
export function saleEndedInCart(item: CartItemResponse): boolean {
  return (
    item.priceChanged &&
    item.pricing !== undefined &&
    item.currentPrice != null &&
    item.currentPrice > item.unitPriceAtAdd &&
    !isOnSale(item.pricing)
  );
}
