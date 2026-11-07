import { getLanguage, translate } from "@/lib/language";
import { formatSaleBaht } from "@/components/sale";
import type { PublicListingDto } from "@/features/catalog/catalog.types";
import { CONDITION_LABELS, PRODUCT_TYPE_LABELS } from "@/features/catalog/catalog.mappers";

import type { PublicSale } from "./sale.types";

const dayMonth = () => new Intl.DateTimeFormat(getLanguage() === "th" ? "th-TH-u-ca-gregory" : "en-GB", { day: "numeric", month: "short" });

/** "ลด 10%" / "ลด ฿50" / "ลดสูงสุด 30%" (Flash) */
export function saleDiscountText(sale: Pick<PublicSale, "discountType" | "discountValue" | "type">): string {
  if (sale.discountType === "FIXED_OFF") return translate(`ลด ${formatSaleBaht(sale.discountValue)}`, `Save ${formatSaleBaht(sale.discountValue)}`);
  if (sale.discountType === "FIXED_PRICE") return translate("ราคาพิเศษ", "Special price");
  return sale.type === "FLASH_SALE" ? translate(`ลดสูงสุด ${sale.discountValue}%`, `Save up to ${sale.discountValue}%`) : translate(`ลด ${sale.discountValue}%`, `Save ${sale.discountValue}%`);
}

/** หัวแคมเปญ: "ลด 10% ทุกการ์ด Pokémon" / "ลด ฿50 ทุกชิ้น" */
export function saleHeadline(sale: PublicSale): string {
  const discount = sale.discountType === "FIXED_OFF" ? translate(`ลด ${formatSaleBaht(sale.discountValue)}`, `Save ${formatSaleBaht(sale.discountValue)}`) : translate(`ลด ${sale.discountValue}%`, `Save ${sale.discountValue}%`);
  return translate(`${discount} ทุกชิ้นในแคมเปญ`, `${discount} on every item in this campaign`);
}

/** บรรทัดเงื่อนไขใต้หัว hero: "สูงสุด ฿500 ต่อชิ้น · คนละ 1 ชิ้นต่อสินค้า · ใช้โค้ดส่วนลดซ้อนได้" */
export function saleTerms(sale: PublicSale): string {
  return [
    sale.discountType === "PERCENT" && sale.maxDiscountPerUnit != null ? translate(`สูงสุด ${formatSaleBaht(sale.maxDiscountPerUnit)} ต่อชิ้น`, `Up to ${formatSaleBaht(sale.maxDiscountPerUnit)} per item`) : null,
    sale.perBuyerLimit != null ? translate(`คนละ ${sale.perBuyerLimit} ชิ้นต่อสินค้า`, `${sale.perBuyerLimit} per buyer per product`) : null,
    translate("ใช้โค้ดส่วนลดซ้อนได้", "Discount codes can be combined"),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** แถบ Flash หน้าแรก: "ลดสูงสุด 30% · คนละ 1 ชิ้นต่อสินค้า · จำนวนจำกัด" */
export function flashSubtitle(sale: PublicSale): string {
  return [saleDiscountText(sale), sale.perBuyerLimit != null ? translate(`คนละ ${sale.perBuyerLimit} ชิ้นต่อสินค้า`, `${sale.perBuyerLimit} per buyer per product`) : null, translate("จำนวนจำกัด", "Limited quantity")]
    .filter(Boolean)
    .join(" · ");
}

/** "ถึง 30 พ.ย." */
export function untilLabel(iso: string): string {
  return translate(`ถึง ${dayMonth().format(new Date(iso))}`, `Until ${dayMonth().format(new Date(iso))}`);
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
