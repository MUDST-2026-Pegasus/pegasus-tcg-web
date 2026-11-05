import { isOnSale } from "@/components/sale";
import type { CartItemResponse } from "@/features/cart/cart.types";

/** ราคาต่อชิ้นที่ตะกร้าคิดตอนนี้ (มาจาก API) */
export function cartUnitPrice(item: Pick<CartItemResponse, "currentPrice" | "unitPriceAtAdd">): number {
  return item.currentPrice ?? item.unitPriceAtAdd;
}

/**
 * แถว "ราคาสินค้า (ก่อนลด)" และ "ส่วนลดราคาสินค้า" ในสรุปตะกร้า/checkout (Figma SAL-B3 C / D)
 * รวมตัวเลขที่ API ส่งมา (`listPrice`, `salePrice`) × จำนวน — ไม่ได้คิดส่วนลดเองที่ FE
 */
export function cartSaleTotals(items: CartItemResponse[]) {
  let listTotal = 0;
  let saleDiscount = 0;
  for (const item of items) {
    const unit = cartUnitPrice(item);
    if (isOnSale(item.pricing)) {
      listTotal += item.pricing.listPrice * item.quantity;
      saleDiscount += (item.pricing.listPrice - item.pricing.salePrice) * item.quantity;
    } else {
      listTotal += unit * item.quantity;
    }
  }
  return { listTotal, saleDiscount, subtotal: listTotal - saleDiscount };
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
