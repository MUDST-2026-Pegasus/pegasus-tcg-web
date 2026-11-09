import { formatSaleBaht } from "@/components/sale";
import type { PublicListingDto } from "@/features/catalog/catalog.types";
import { CONDITION_LABELS, PRODUCT_TYPE_LABELS } from "@/features/catalog/catalog.mappers";

import type { PublicSale } from "./sale.types";
import { dateTimeFormat } from "@/lib/i18n";

const dayMonth = dateTimeFormat({ day: "numeric", month: "short" }, { calendar: "gregory" });

/** "ลด 10%" / "ลด ฿50" / "ลดสูงสุด 30%" (Flash) */
export function saleDiscountText(sale: Pick<PublicSale, "discountType" | "discountValue" | "type">): string {
  if (sale.discountType === "FIXED_OFF") return `ลด ${formatSaleBaht(sale.discountValue)}`;
  if (sale.discountType === "FIXED_PRICE") return "ราคาพิเศษ";
  return sale.type === "FLASH_SALE" ? `ลดสูงสุด ${sale.discountValue}%` : `ลด ${sale.discountValue}%`;
}

/** หัวแคมเปญ: "ลด 10% ทุกการ์ด Pokémon" / "ลด ฿50 ทุกชิ้น" */
export function saleHeadline(sale: PublicSale): string {
  const discount = sale.discountType === "FIXED_OFF" ? `ลด ${formatSaleBaht(sale.discountValue)}` : `ลด ${sale.discountValue}%`;
  return `${discount} ทุกชิ้นในแคมเปญ`;
}

/** บรรทัดเงื่อนไขใต้หัว hero: "สูงสุด ฿500 ต่อชิ้น · คนละ 1 ชิ้นต่อสินค้า · ใช้โค้ดส่วนลดซ้อนได้" */
export function saleTerms(sale: PublicSale): string {
  return [
    sale.discountType === "PERCENT" && sale.maxDiscountPerUnit != null ? `สูงสุด ${formatSaleBaht(sale.maxDiscountPerUnit)} ต่อชิ้น` : null,
    sale.perBuyerLimit != null ? `คนละ ${sale.perBuyerLimit} ชิ้นต่อสินค้า` : null,
    "ใช้โค้ดส่วนลดซ้อนได้",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** แถบ Flash หน้าแรก: "ลดสูงสุด 30% · คนละ 1 ชิ้นต่อสินค้า · จำนวนจำกัด" */
export function flashSubtitle(sale: PublicSale): string {
  return [saleDiscountText(sale), sale.perBuyerLimit != null ? `คนละ ${sale.perBuyerLimit} ชิ้นต่อสินค้า` : null, "จำนวนจำกัด"]
    .filter(Boolean)
    .join(" · ");
}

/** "ถึง 30 พ.ย." */
export function untilLabel(iso: string): string {
  return `ถึง ${dayMonth.format(new Date(iso))}`;
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
