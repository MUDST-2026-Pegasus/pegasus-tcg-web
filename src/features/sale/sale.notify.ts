import { getLanguage, translate } from "@/lib/language";
import { formatSaleBaht, isOnSale, type ListingPricing } from "@/components/sale";
import { toast } from "@/components/ui/toast";
import { hasErrorCode, isApiError } from "@/lib/api";

const clock = () => new Intl.DateTimeFormat(getLanguage() === "th" ? "th-TH-u-ca-gregory" : "en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/**
 * toast หลังเพิ่มลงตะกร้า (Figma SAL-M1 Buyer)
 * - ราคา Flash → "เพิ่มลงตะกร้าที่ราคา Flash" + ราคานี้ถึงกี่โมง
 * - เกินจำกัดต่อคน → `SALE_BUYER_LIMIT_REACHED` ชิ้นที่เกินคิดราคาปกติ
 * คืน `false` เมื่อไม่ใช่ราคา Flash ให้ผู้เรียกแสดง toast เดิมของตัวเอง
 */
export function notifyAddedAtSalePrice(
  name: string,
  quantity: number,
  pricing: ListingPricing | null | undefined,
  options?: { imageUrl: string | null; onViewCart: () => void; manager: typeof toast; viewCartLabel: string },
): boolean {
  if (!isOnSale(pricing) || pricing.sale.type !== "FLASH_SALE") return false;
  const limit = pricing.sale.perBuyerLimit;
  (options?.manager ?? toast).add({
    ...(options ? { timeout: 4000, data: { quickCart: true, imageUrl: options.imageUrl },
      actionProps: { children: options.viewCartLabel, onClick: options.onViewCart } } : {}),
    title: translate("เพิ่มลงตะกร้าที่ราคา Flash", "Added to cart at the flash price"),
    description: translate(`เพิ่ม ${name} ราคา ${formatSaleBaht(pricing.salePrice)} แล้ว · ราคานี้ถึง ${clock().format(new Date(pricing.sale.endsAt))} ต้องชำระก่อนหมดเวลาจองสต็อก`, `Added ${name} at ${formatSaleBaht(pricing.salePrice)} · Price valid until ${clock().format(new Date(pricing.sale.endsAt))}. Pay before the stock reservation expires.`),
    type: "success",
  });
  if (limit != null && quantity > limit) notifyBuyerLimit(limit, pricing.listPrice);
  return true;
}

/** "ราคา Flash จำกัดคนละ 1 ชิ้น · ชิ้นที่ 2 คิดราคาปกติ ฿1,990" */
export function notifyBuyerLimit(limit: number, listPrice: number) {
  toast.add({
    title: "SALE_BUYER_LIMIT_REACHED",
    description: translate(`ราคา Flash จำกัดคนละ ${limit} ชิ้น · ชิ้นที่ ${limit + 1} คิดราคาปกติ ${formatSaleBaht(listPrice)}`, `The flash price is limited to ${limit} per buyer · Item ${limit + 1} uses the regular price ${formatSaleBaht(listPrice)}`),
    type: "warning",
  });
}

/** error ของราคาลดที่ checkout ต้องจัดการเอง (modal / toast) แทนข้อความทั่วไป */
export function isSaleCheckoutError(error: unknown): boolean {
  return hasErrorCode(error, "SALE_QUOTA_REACHED", "SALE_BUYER_LIMIT_REACHED");
}

/** listing ที่ backend บอกว่าโควตา Flash เต็ม (details.listingId) */
export function quotaListingId(error: unknown): number | null {
  if (!isApiError(error)) return null;
  const id = Number(error.details.listingId);
  return Number.isFinite(id) && id > 0 ? id : null;
}
