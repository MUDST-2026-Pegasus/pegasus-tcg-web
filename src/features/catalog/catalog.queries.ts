import { keepPreviousData, useQuery } from "@tanstack/react-query";

import * as catalogApi from "./catalog.api";
import type { ProductQuery } from "./catalog.types";
import { isApiError } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/**
 * รายชื่อเกมกับหมวดหมู่เปลี่ยนไม่บ่อย และหลายหน้าใช้ร่วมกัน (หน้าแรก ตัวกรองหน้าค้นหา)
 * จึงแคชไว้ใต้คีย์เดียว — hook ที่อยากได้รูปแบบอื่นใช้ `select` เอา
 */
export const catalogKeys = {
  all: ["catalog"] as const,
  games: () => [...catalogKeys.all, "games"] as const,
  categories: () => [...catalogKeys.all, "categories"] as const,
  cardSets: (gameId: number) =>
    [...catalogKeys.all, "card-sets", gameId] as const,
  products: (query: ProductQuery) =>
    [...catalogKeys.all, "products", query] as const,
  product: (idOrSlug: string) =>
    [...catalogKeys.all, "product", idOrSlug] as const,
  market: (productId: number) =>
    [...catalogKeys.all, "product", productId, "market"] as const,
  listings: (productId: number) =>
    [...catalogKeys.all, "product", productId, "listings"] as const,
  listing: (id: number) => [...catalogKeys.all, "listing", id] as const,
  collectors: (productId: number, page: number) =>
    [...catalogKeys.all, "product", productId, "collectors", page] as const,
  effects: (productId: number) =>
    [...catalogKeys.all, "product", productId, "effects"] as const,
  facets: (query: Omit<ProductQuery, "sort" | "page" | "size">) =>
    [...catalogKeys.all, "facets", query] as const,
  suggest: (q: string) => [...catalogKeys.all, "suggest", q] as const,
  trending: () => [...catalogKeys.all, "trending"] as const,
};

export function useGameList() {
  return useQuery({
    queryKey: catalogKeys.games(),
    queryFn: catalogApi.getGames,
  });
}

export function useCategoryList() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: catalogApi.getCategories,
  });
}

/** ชุดการ์ดของเกมเดียว — ยังไม่เลือกเกม (`null`) ก็ยังไม่ถาม */
export function useCardSetList(gameId: number | null) {
  return useQuery({
    queryKey: catalogKeys.cardSets(gameId ?? 0),
    queryFn: () => catalogApi.getCardSets(gameId!),
    enabled: gameId !== null,
  });
}

/**
 * ผลค้นหาหนึ่งหน้า — ระหว่างโหลดหน้าถัดไปหรือเปลี่ยนตัวกรอง ยังโชว์ผลเดิมไว้
 * (`isPlaceholderData`) หน้าจอจะได้ไม่กระพริบเป็นโครงว่าง
 *
 * @param enabled false ระหว่างรอแปลง slug ในลิงก์ (เช่น `?game=pokemon-tcg`) เป็น id
 */
export function useProductSearch(query: ProductQuery, enabled = true) {
  return useQuery({
    queryKey: catalogKeys.products(query),
    queryFn: ({ signal }) => catalogApi.getProducts(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useProductDetail(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.product(idOrSlug ?? ""),
    queryFn: ({ signal }) => catalogApi.getProductDetail(idOrSlug!, signal),
    enabled: Boolean(idOrSlug),
    retry: (failureCount, error) =>
      !(isApiError(error) && error.status === 404) && failureCount < 2,
  });
}

export function useProductListings(productId: number) {
  return useQuery({
    queryKey: catalogKeys.listings(productId),
    queryFn: ({ signal }) => catalogApi.getProductListings(productId, signal),
  });
}

export function useProductMarket(productId: number) {
  return useQuery({
    queryKey: catalogKeys.market(productId),
    queryFn: ({ signal }) => catalogApi.getProductMarket(productId, signal),
    retry: false,
  });
}

export function useListingDetail(id: number) {
  return useQuery({
    queryKey: catalogKeys.listing(id),
    queryFn: ({ signal }) => catalogApi.getListingDetail(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
    retry: (failureCount, error) =>
      !(isApiError(error) && error.status === 404) && failureCount < 2,
  });
}

export function useProductCollectors(productId: number, page: number) {
  return useQuery({
    queryKey: catalogKeys.collectors(productId, page),
    queryFn: ({ signal }) =>
      catalogApi.getProductCollectors(productId, page, signal),
  });
}

export function useProductCardEffects(productId: number) {
  return useQuery({
    queryKey: catalogKeys.effects(productId),
    queryFn: ({ signal }) =>
      catalogApi.getProductCardEffects(productId, signal),
  });
}

export function useGameAttributes(gameId: number) {
  return useQuery({
    queryKey: [...catalogKeys.all, "attributes", gameId],
    queryFn: ({ signal }) => catalogApi.getGameAttributes(gameId, signal),
  });
}

export function useSellerListings(username: string) {
  return useQuery({
    queryKey: [...catalogKeys.all, "seller-listings", username],
    queryFn: ({ signal }) => catalogApi.getSellerListings(username, signal),
    enabled: Boolean(username),
  });
}

/** หน่วงก่อนยิง suggest — พิมพ์ต่อเนื่องจะยิงครั้งเดียวหลังหยุดพิมพ์ */
export const SUGGEST_DEBOUNCE_MS = 150;

/**
 * dropdown ของช่องค้นหา [TCG-776] — key ตามคำที่ trim แล้ว พิมพ์ต่อ key เปลี่ยน
 * request เก่าที่ไม่มีใครรอแล้วจะถูก abort ผ่าน `signal` · q ว่างไม่ยิง
 *
 * ระหว่างรอคำใหม่ยังโชว์ผลของคำก่อนหน้า (`isPlaceholderData`) ไม่ให้ dropdown กระพริบ
 */
export function useSearchSuggest(q: string) {
  const term = useDebouncedValue(q.trim(), SUGGEST_DEBOUNCE_MS);
  const settled = term === q.trim();
  const query = useQuery({
    queryKey: catalogKeys.suggest(term),
    queryFn: ({ signal }) => catalogApi.getSearchSuggest(term, signal),
    enabled: term !== "",
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  return { ...query, term, settled };
}

/** คำค้นยอดฮิต 7 วัน — เปิด dropdown ทีไรใช้แคชเดิม */
export function useTrendingSearches(enabled = true) {
  return useQuery({
    queryKey: catalogKeys.trending(),
    queryFn: ({ signal }) => catalogApi.getTrendingSearches(5, signal),
    staleTime: 5 * 60_000,
    enabled,
  });
}

/** ตัวเลขข้าง sidebar ของหน้าค้นหา — เปลี่ยนตัวกรองแล้วโชว์ตัวเลขเดิมไว้ระหว่างโหลด [TCG-777] */
export function useSearchFacets(query: ProductQuery, enabled = true) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- facets ไม่ใช้ sort/page/size
  const { sort, page, size, ...filters } = query;
  return useQuery({
    queryKey: catalogKeys.facets(filters),
    queryFn: ({ signal }) => catalogApi.getSearchFacets(filters, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}
