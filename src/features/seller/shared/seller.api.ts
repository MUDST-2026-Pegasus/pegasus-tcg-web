import { api } from "@/lib/api";

import type { SellerProfile } from "./seller.types";

/** component ไม่ควรเรียกไฟล์นี้ตรง ๆ ให้ผ่าน `useSellerProfile()` ใน `seller.queries.ts` */

/** โปรไฟล์ผู้ขายของคนที่ login อยู่ — ยังไม่เคยสมัครจะได้ `SELLER_NOT_FOUND` (404) */
export function getSellerProfile(): Promise<SellerProfile> {
  return api.get<SellerProfile>("/sellers/me");
}
