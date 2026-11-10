import {
  CONDITION_LABEL,
  LISTING_STATUS_LABEL,
} from "@/features/seller/products/products.format";

import { translate } from "@/lib/i18n";

import type { AdminCardListing, ListingStatus } from "./catalog.types";

/** ตัวช่วยของแท็บ "ร้านที่ขาย" — ไม่มี React ไม่มี state */

/** "PSA 10" ถ้าเกรดแล้ว ไม่งั้นชื่อสภาพการ์ด */
export function listingConditionLabel(
  listing: Pick<
    AdminCardListing,
    "condition" | "gradingCompany" | "gradeValue"
  >,
): string {
  if (listing.gradingCompany) {
    return [listing.gradingCompany, listing.gradeValue]
      .filter((part) => part !== null)
      .join(" ");
  }
  return CONDITION_LABEL[listing.condition];
}

/** บรรทัดใต้ชื่อร้าน — ประกาศเปิดอยู่แต่ร้านขายไม่ได้ ต้องเห็นตั้งแต่ในตาราง */
export function closedShopLabel(listing: AdminCardListing): string | null {
  if (listing.status !== "ACTIVE") return null;
  const { seller } = listing;
  if (seller.status !== "VERIFIED" || !seller.accountActive) {
    return translate("admin", "catalog.listings.shopSuspended", "ร้านถูกระงับ · ซื้อไม่ได้");
  }
  return seller.onVacation ? translate("admin", "catalog.listings.shopOnVacation", "ร้านปิดชั่วคราว · ซื้อไม่ได้") : null;
}

/** ปลดแล้วไปสถานะไหน — ตรงกับ `AdminCardListingService.unblock` */
export function unblockTarget(listing: AdminCardListing): ListingStatus {
  const from = listing.block?.fromStatus;
  if (from === "ACTIVE" || from === "SOLD_OUT") {
    if (listing.seller.status !== "VERIFIED") return "PAUSED";
    return listing.quantityAvailable > 0 ? "ACTIVE" : "SOLD_OUT";
  }
  return from ?? "PAUSED";
}

/** หน้าประกาศเปิดได้เฉพาะสองสถานะนี้ — ตรงกับ `ListingStatus.publiclyVisible()` */
export function hasPublicPage(status: ListingStatus): boolean {
  return status === "ACTIVE" || status === "SOLD_OUT";
}

export const LISTING_STATUS_FILTERS: ListingStatus[] = [
  "ACTIVE",
  "PAUSED",
  "SOLD_OUT",
  "BLOCKED",
  "DELISTED",
  "DRAFT",
];

export { LISTING_STATUS_LABEL };

/** ชื่อย่อสำหรับ avatar — ใช้ username เพราะทุกร้านมี */
export function shopInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

// @tolgee-key {"key": "catalog.listings.shopSuspended", "ns": "admin", "defaultValue": "ร้านถูกระงับ · ซื้อไม่ได้"}
// @tolgee-key {"key": "catalog.listings.shopOnVacation", "ns": "admin", "defaultValue": "ร้านปิดชั่วคราว · ซื้อไม่ได้"}
