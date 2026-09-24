import { api, hasErrorCode } from "@/lib/api";

import type { SellerProfile } from "./seller.types";

/** component ไม่ควรเรียกไฟล์นี้ตรง ๆ ให้ผ่าน `useSellerProfile()` ใน `seller.queries.ts` */

/**
 * โปรไฟล์ผู้ขายของคนที่ login อยู่ — `null` = ยังไม่มี seller profile
 * (backend ตอบ `SELLER_NOT_FOUND`) ซึ่งเกิดได้แม้มีบทบาท SELLER เช่นบัญชีที่ขอบทบาทตอนสมัคร
 * ถือเป็นสถานะปกติ ไม่ใช่ error ที่กดลองใหม่แล้วจะหาย
 */
export async function getSellerProfile(): Promise<SellerProfile | null> {
  try {
    return await api.get<SellerProfile>("/sellers/me");
  } catch (error) {
    if (hasErrorCode(error, "SELLER_NOT_FOUND")) {
      return null;
    }
    throw error;
  }
}
