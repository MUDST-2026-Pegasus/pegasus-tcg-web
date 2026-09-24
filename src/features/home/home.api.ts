import { api, type PageResponse } from "@/lib/api";

import type {
  HomeBannerDto,
  PublicListingDto,
  TrendingProductDto,
} from "./home.types";

/**
 * ทุกเส้นในหน้าแรกเป็น public — ส่ง `auth: false` ไม่ให้ token ที่หมดอายุ
 * ทำให้คนที่ยังไม่ login เปิดหน้าแรกไม่ขึ้น
 *
 * เกม หมวดหมู่ และรายการสินค้าอยู่ใน `@/features/catalog/catalog.api` ใช้ร่วมกับหน้าค้นหา
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `home.queries.ts`
 */
const PUBLIC = { auth: false } as const;

export function getBanners(): Promise<HomeBannerDto[]> {
  return api.get<HomeBannerDto[]>("/home/banners", PUBLIC);
}

export function getTrending(limit: number): Promise<TrendingProductDto[]> {
  return api.get<TrendingProductDto[]>("/catalog/trending", {
    ...PUBLIC,
    query: { limit },
  });
}

/** หน้าร้านของผู้ขายหนึ่งคน — ใช้กับร้าน Pegasus ในแถว Pegasus Picks */
export function getStorefront(
  username: string,
  size: number,
): Promise<PageResponse<PublicListingDto>> {
  return api.get<PageResponse<PublicListingDto>>(
    `/u/${encodeURIComponent(username)}/listings`,
    { ...PUBLIC, query: { sort: "newest", size } },
  );
}
