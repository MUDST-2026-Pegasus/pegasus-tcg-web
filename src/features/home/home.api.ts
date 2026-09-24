import { api, type PageResponse } from "@/lib/api";

import type {
  CategoryDto,
  GameDto,
  HomeBannerDto,
  ProductQuery,
  ProductSummaryDto,
  PublicListingDto,
  TrendingProductDto,
} from "./home.types";

/**
 * ทุกเส้นในหน้าแรกเป็น public — ส่ง `auth: false` ไม่ให้ token ที่หมดอายุ
 * ทำให้คนที่ยังไม่ login เปิดหน้าแรกไม่ขึ้น
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `home.queries.ts`
 */
const PUBLIC = { auth: false } as const;

export function getBanners(): Promise<HomeBannerDto[]> {
  return api.get<HomeBannerDto[]>("/home/banners", PUBLIC);
}

export function getGames(): Promise<GameDto[]> {
  return api.get<GameDto[]>("/games", PUBLIC);
}

export function getCategories(): Promise<CategoryDto[]> {
  return api.get<CategoryDto[]>("/categories", PUBLIC);
}

export function getProducts(
  query: ProductQuery,
): Promise<PageResponse<ProductSummaryDto>> {
  return api.get<PageResponse<ProductSummaryDto>>("/catalog/products", {
    ...PUBLIC,
    query,
  });
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
