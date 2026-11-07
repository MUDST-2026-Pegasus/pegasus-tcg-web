import { translate } from "@/lib/language";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import type { AvailablePromotion } from "./promotions.types";

/** ข้อความเมื่อใส่ตะกร้าไม่สำเร็จ — ใช้ร่วมกันระหว่างหน้ารายละเอียดสินค้ากับหน้าประกาศขาย */
export function addToCartErrorMessage(
  error: unknown,
  fallback = translate("เพิ่มสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง", "Could not add the item. Please try again"),
): string {
  if (hasErrorCode(error, "CANNOT_BUY_OWN_LISTING")) {
    return translate("ไม่สามารถซื้อสินค้าที่คุณเป็นผู้ขายเองได้", "You cannot buy your own listing");
  }
  if (hasErrorCode(error, "INSUFFICIENT_STOCK")) {
    return translate("สินค้าเหลือไม่พอตามจำนวนที่เลือก กรุณาปรับจำนวนแล้วลองอีกครั้ง", "There is not enough stock. Adjust the quantity and try again");
  }
  return getErrorMessage(error, fallback);
}

/** The badge on a code row: usable collected codes first, then ones still to collect. */
export function codeHint(promotions: AvailablePromotion[]): string | null {
  const usable = promotions.filter((p) => p.source !== "CLAIMABLE" && p.applicable).length;
  if (usable) return translate(`มีโค้ดใช้ได้ ${usable} ใบ`, `${usable} available coupons`);
  const claimable = promotions.filter((p) => p.source === "CLAIMABLE" && p.remainingClaims !== 0).length;
  return claimable ? translate(`มีโค้ดให้เก็บ ${claimable} ใบ`, `${claimable} coupons to collect`) : null;
}
