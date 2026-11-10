import { formatSaleBaht, isOnSale, type ListingPricing } from "@/components/sale";
import { toast } from "@/components/ui/toast";
import { hasErrorCode, isApiError } from "@/lib/api";
import { dateTimeFormat, translate } from "@/lib/i18n";

const clock = dateTimeFormat({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, { calendar: "gregory" });

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
    title: translate("sale", "notify.added.title", "เพิ่มลงตะกร้าที่ราคา Flash"),
    description: translate("sale", "notify.added.description", "เพิ่ม {name} ราคา {price} แล้ว · ราคานี้ถึง {time} ต้องชำระก่อนหมดเวลาจองสต็อก", { name, price: formatSaleBaht(pricing.salePrice), time: clock.format(new Date(pricing.sale.endsAt)) }),
    type: "success",
  });
  if (limit != null && quantity > limit) notifyBuyerLimit(limit, pricing.listPrice);
  return true;
}

/** "ราคา Flash จำกัดคนละ 1 ชิ้น · ชิ้นที่ 2 คิดราคาปกติ ฿1,990" */
export function notifyBuyerLimit(limit: number, listPrice: number) {
  toast.add({
    title: "SALE_BUYER_LIMIT_REACHED",
    description: translate("sale", "notify.buyerLimit", "ราคา Flash จำกัดคนละ {limit} ชิ้น · ชิ้นที่ {next} คิดราคาปกติ {price}", { limit, next: limit + 1, price: formatSaleBaht(listPrice) }),
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

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-744]
// @tolgee-key {"key": "notify.added.title", "ns": "sale", "defaultValue": "เพิ่มลงตะกร้าที่ราคา Flash"}
// @tolgee-key {"key": "notify.added.description", "ns": "sale", "defaultValue": "เพิ่ม {name} ราคา {price} แล้ว · ราคานี้ถึง {time} ต้องชำระก่อนหมดเวลาจองสต็อก"}
// @tolgee-key {"key": "notify.buyerLimit", "ns": "sale", "defaultValue": "ราคา Flash จำกัดคนละ {limit} ชิ้น · ชิ้นที่ {next} คิดราคาปกติ {price}"}
