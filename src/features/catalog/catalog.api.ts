import { api, type PageResponse } from "@/lib/api";

import type {
  CardSetDto,
  CategoryDto,
  GameDto,
  ProductQuery,
  ProductSummaryDto,
  ProductDetailDto,
  PublicListingDto,
  PublicListingDetailDto,
  ProductCollectorDto,
  CatalogCardEffectDto,
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

export function getCardSets(gameId: number): Promise<CardSetDto[]> {
  return api.get<CardSetDto[]>("/card-sets", { ...PUBLIC, query: { gameId } });
}

export function getProducts(
  query: ProductQuery,
): Promise<PageResponse<ProductSummaryDto>> {
  return api.get<PageResponse<ProductSummaryDto>>("/catalog/products", {
    ...PUBLIC,
    query,
  });
}

export function getProductDetail(idOrSlug: string, signal?: AbortSignal) {
  return api.get<ProductDetailDto>(
    `/catalog/products/${encodeURIComponent(idOrSlug)}`,
    { ...PUBLIC, signal },
  );
}

/** Read every page so condition counts and seller rows are complete. */
export async function getProductListings(
  productId: number,
  signal?: AbortSignal,
): Promise<PublicListingDto[]> {
  const listings: PublicListingDto[] = [];
  let page = 0;

  while (true) {
    const result = await api.get<PageResponse<PublicListingDto>>("/listings", {
      ...PUBLIC,
      signal,
      query: { productId, sort: "price", page, size: 100 },
    });
    listings.push(...result.items);
    page += 1;
    if (page >= result.totalPages || result.items.length === 0) break;
  }

  return listings;
}

export function getListingDetail(id: number, signal?: AbortSignal) {
  return api.get<PublicListingDetailDto>(`/listings/${id}`, { ...PUBLIC, signal });
}

export function getProductCollectors(productId: number, page: number, signal?: AbortSignal) {
  return api.get<PageResponse<ProductCollectorDto>>(
    `/catalog/products/${productId}/collectors`,
    { ...PUBLIC, signal, query: { page, size: 20 } },
  );
}

export function getProductCardEffects(productId: number, signal?: AbortSignal) {
  return api.get<CatalogCardEffectDto[]>(
    `/catalog/products/${productId}/effects`,
    { ...PUBLIC, signal },
  );
}
