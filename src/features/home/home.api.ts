import { api, isApiError, type PageResponse } from "@/lib/api";

import type {
  HomeBannerDto,
  PublicListingDto,
  PublicProfileDto,
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

export async function getPublicProfile(username: string, signal?: AbortSignal): Promise<PublicProfileDto> {
  try {
    return await api.get<PublicProfileDto>(`/u/${encodeURIComponent(username)}`, { ...PUBLIC, signal });
  } catch (error) {
    // Older API versions only expose the seller inside each public listing.
    if (!isApiError(error) || ![401, 403, 404].includes(error.status)) throw error;
    const listings = await getStorefront(username, 1, 0, signal);
    return listings.items[0]?.seller ?? { username, displayName: null, avatarUrl: null };
  }
}

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
  page = 0,
  signal?: AbortSignal,
): Promise<PageResponse<PublicListingDto>> {
  return api.get<PageResponse<PublicListingDto>>(
    `/u/${encodeURIComponent(username)}/listings`,
    { ...PUBLIC, signal, query: { sort: "newest", size, page } },
  );
}
