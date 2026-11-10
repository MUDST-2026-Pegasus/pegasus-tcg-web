import { hasErrorCode } from "@/lib/api";
import type { AvailablePromotion } from "./promotions.types";
import { translate, translateError } from "@/lib/i18n";

// @tolgee-key {"key": "cart.add.failed", "ns": "buyer", "defaultValue": "เพิ่มสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง"}
// @tolgee-key {"key": "cart.add.ownListing", "ns": "buyer", "defaultValue": "ไม่สามารถซื้อสินค้าที่คุณเป็นผู้ขายเองได้"}
// @tolgee-key {"key": "cart.add.insufficientStock", "ns": "buyer", "defaultValue": "สินค้าเหลือไม่พอตามจำนวนที่เลือก กรุณาปรับจำนวนแล้วลองอีกครั้ง"}
// @tolgee-key {"key": "cart.code.usableHint", "ns": "buyer", "defaultValue": "มีโค้ดใช้ได้ {count} ใบ"}
// @tolgee-key {"key": "cart.code.claimableHint", "ns": "buyer", "defaultValue": "มีโค้ดให้เก็บ {count} ใบ"}

/** ข้อความเมื่อใส่ตะกร้าไม่สำเร็จ — ใช้ร่วมกันระหว่างหน้ารายละเอียดสินค้ากับหน้าประกาศขาย */
export function addToCartErrorMessage(
  error: unknown,
  fallback = translate("buyer", "cart.add.failed", "เพิ่มสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง"),
): string {
  if (hasErrorCode(error, "CANNOT_BUY_OWN_LISTING")) {
    return translate("buyer", "cart.add.ownListing", "ไม่สามารถซื้อสินค้าที่คุณเป็นผู้ขายเองได้");
  }
  if (hasErrorCode(error, "INSUFFICIENT_STOCK")) {
    return translate("buyer", "cart.add.insufficientStock", "สินค้าเหลือไม่พอตามจำนวนที่เลือก กรุณาปรับจำนวนแล้วลองอีกครั้ง");
  }
  return translateError(error, fallback);
}

/** The badge on a code row: usable collected codes first, then ones still to collect. */
export function codeHint(promotions: AvailablePromotion[]): string | null {
  const usable = promotions.filter((p) => p.source !== "CLAIMABLE" && p.applicable).length;
  if (usable) return translate("buyer", "cart.code.usableHint", "มีโค้ดใช้ได้ {count} ใบ", { count: usable });
  const claimable = promotions.filter((p) => p.source === "CLAIMABLE" && p.remainingClaims !== 0).length;
  return claimable ? translate("buyer", "cart.code.claimableHint", "มีโค้ดให้เก็บ {count} ใบ", { count: claimable }) : null;
}
