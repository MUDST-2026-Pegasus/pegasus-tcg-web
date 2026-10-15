import { getErrorMessage, hasErrorCode } from "@/lib/api";

/** ข้อความเมื่อใส่ตะกร้าไม่สำเร็จ — ใช้ร่วมกันระหว่างหน้ารายละเอียดสินค้ากับหน้าประกาศขาย */
export function addToCartErrorMessage(
  error: unknown,
  fallback = "เพิ่มสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง",
): string {
  if (hasErrorCode(error, "CANNOT_BUY_OWN_LISTING")) {
    return "ไม่สามารถซื้อสินค้าที่คุณเป็นผู้ขายเองได้";
  }
  if (hasErrorCode(error, "INSUFFICIENT_STOCK")) {
    return "สินค้าเหลือไม่พอตามจำนวนที่เลือก กรุณาปรับจำนวนแล้วลองอีกครั้ง";
  }
  return getErrorMessage(error, fallback);
}
