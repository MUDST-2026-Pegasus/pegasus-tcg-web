import { api, type PageResponse } from "@/lib/api";

import type {
  CategoryDto,
  GameDto,
  ProductQuery,
  ProductSummaryDto,
} from "./catalog.types";

/**
 * catalogue เป็น public ทั้งหมด — ส่ง `auth: false` ไม่ให้ token ที่หมดอายุ
 * ทำให้คนที่ยังไม่ login ค้นหาไม่ได้
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `catalog.queries.ts`
 */
const PUBLIC = { auth: false } as const;

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
