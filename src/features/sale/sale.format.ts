import { formatSaleBaht } from "@/components/sale";
import type { PublicListingDto } from "@/features/catalog/catalog.types";
import { CONDITION_LABELS, PRODUCT_TYPE_LABELS } from "@/features/catalog/catalog.mappers";

import type { PublicSale } from "./sale.types";
import { dateTimeFormat, translate } from "@/lib/i18n";

const dayMonth = dateTimeFormat({ day: "numeric", month: "short" }, { calendar: "gregory" });

/** "ลด 10%" / "ลด ฿50" / "ลดสูงสุด 30%" (Flash) */
export function saleDiscountText(sale: Pick<PublicSale, "discountType" | "discountValue" | "type">): string {
  if (sale.discountType === "FIXED_OFF") return translate("sale", "discount.fixedOff", "ลด {amount}", { amount: formatSaleBaht(sale.discountValue) });
  if (sale.discountType === "FIXED_PRICE") return translate("sale", "discount.fixedPrice", "ราคาพิเศษ");
  return sale.type === "FLASH_SALE"
    ? translate("sale", "discount.upToPercent", "ลดสูงสุด {percent}%", { percent: sale.discountValue ?? 0 })
    : translate("sale", "discount.percent", "ลด {percent}%", { percent: sale.discountValue ?? 0 });
}

/** หัวแคมเปญ: "ลด 10% ทุกการ์ด Pokémon" / "ลด ฿50 ทุกชิ้น" */
export function saleHeadline(sale: PublicSale): string {
  const discount =
    sale.discountType === "FIXED_OFF"
      ? translate("sale", "discount.fixedOff", "ลด {amount}", { amount: formatSaleBaht(sale.discountValue) })
      : translate("sale", "discount.percent", "ลด {percent}%", { percent: sale.discountValue ?? 0 });
  return translate("sale", "headline", "{discount} ทุกชิ้นในแคมเปญ", { discount });
}

/** บรรทัดเงื่อนไขใต้หัว hero: "สูงสุด ฿500 ต่อชิ้น · คนละ 1 ชิ้นต่อสินค้า · ใช้โค้ดส่วนลดซ้อนได้" */
export function saleTerms(sale: PublicSale): string {
  return [
    sale.discountType === "PERCENT" && sale.maxDiscountPerUnit != null ? translate("sale", "terms.maxPerUnit", "สูงสุด {amount} ต่อชิ้น", { amount: formatSaleBaht(sale.maxDiscountPerUnit) }) : null,
    sale.perBuyerLimit != null ? translate("sale", "terms.perBuyer", "คนละ {limit} ชิ้นต่อสินค้า", { limit: sale.perBuyerLimit }) : null,
    translate("sale", "terms.stackable", "ใช้โค้ดส่วนลดซ้อนได้"),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** แถบ Flash หน้าแรก: "ลดสูงสุด 30% · คนละ 1 ชิ้นต่อสินค้า · จำนวนจำกัด" */
export function flashSubtitle(sale: PublicSale): string {
  return [saleDiscountText(sale), sale.perBuyerLimit != null ? translate("sale", "terms.perBuyer", "คนละ {limit} ชิ้นต่อสินค้า", { limit: sale.perBuyerLimit }) : null, translate("sale", "terms.limited", "จำนวนจำกัด")]
    .filter(Boolean)
    .join(" · ");
}

/** "ถึง 30 พ.ย." */
export function untilLabel(iso: string): string {
  return translate("sale", "until", "ถึง {date}", { date: dayMonth.format(new Date(iso)) });
}

/** listing → props ของ `SaleProductCard` */
export function listingCardProps(listing: PublicListingDto) {
  return {
    title: listing.card.productName,
    type: CONDITION_LABELS[listing.condition] ?? PRODUCT_TYPE_LABELS.SINGLE_CARD,
    image: listing.primaryPhotoUrl ?? listing.card.officialImageUrl,
    href: `/listings/${listing.id}`,
    pricing: listing.pricing ?? null,
    price: listing.price,
    quota: listing.saleQuota ?? null,
  };
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-744]
// @tolgee-key {"key": "discount.fixedOff", "ns": "sale", "defaultValue": "ลด {amount}"}
// @tolgee-key {"key": "discount.fixedPrice", "ns": "sale", "defaultValue": "ราคาพิเศษ"}
// @tolgee-key {"key": "discount.upToPercent", "ns": "sale", "defaultValue": "ลดสูงสุด {percent}%"}
// @tolgee-key {"key": "discount.percent", "ns": "sale", "defaultValue": "ลด {percent}%"}
// @tolgee-key {"key": "headline", "ns": "sale", "defaultValue": "{discount} ทุกชิ้นในแคมเปญ"}
// @tolgee-key {"key": "terms.maxPerUnit", "ns": "sale", "defaultValue": "สูงสุด {amount} ต่อชิ้น"}
// @tolgee-key {"key": "terms.perBuyer", "ns": "sale", "defaultValue": "คนละ {limit} ชิ้นต่อสินค้า"}
// @tolgee-key {"key": "terms.stackable", "ns": "sale", "defaultValue": "ใช้โค้ดส่วนลดซ้อนได้"}
// @tolgee-key {"key": "terms.limited", "ns": "sale", "defaultValue": "จำนวนจำกัด"}
// @tolgee-key {"key": "until", "ns": "sale", "defaultValue": "ถึง {date}"}
