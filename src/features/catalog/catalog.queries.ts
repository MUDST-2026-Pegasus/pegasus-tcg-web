import { keepPreviousData, useQuery } from "@tanstack/react-query";

import * as catalogApi from "./catalog.api";
import type { ProductQuery } from "./catalog.types";
import { isApiError } from "@/lib/api";

/**
 * รายชื่อเกมกับหมวดหมู่เปลี่ยนไม่บ่อย และหลายหน้าใช้ร่วมกัน (หน้าแรก ตัวกรองหน้าค้นหา)
 * จึงแคชไว้ใต้คีย์เดียว — hook ที่อยากได้รูปแบบอื่นใช้ `select` เอา
 */
export const catalogKeys = {
  all: ["catalog"] as const,
  games: () => [...catalogKeys.all, "games"] as const,
  categories: () => [...catalogKeys.all, "categories"] as const,
  products: (query: ProductQuery) =>
    [...catalogKeys.all, "products", query] as const,
  product: (idOrSlug: string) => [...catalogKeys.all, "product", idOrSlug] as const,
  listings: (productId: number) => [...catalogKeys.all, "product", productId, "listings"] as const,
  listing: (id: number) => [...catalogKeys.all, "listing", id] as const,
  collectors: (productId: number, page: number) =>
    [...catalogKeys.all, "product", productId, "collectors", page] as const,
  effects: (productId: number) =>
    [...catalogKeys.all, "product", productId, "effects"] as const,
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

/**
 * ผลค้นหาหนึ่งหน้า — ระหว่างโหลดหน้าถัดไปหรือเปลี่ยนตัวกรอง ยังโชว์ผลเดิมไว้
 * (`isPlaceholderData`) หน้าจอจะได้ไม่กระพริบเป็นโครงว่าง
 *
 * @param enabled false ระหว่างรอแปลง slug ในลิงก์ (เช่น `?game=pokemon-tcg`) เป็น id
 */
export function useProductSearch(query: ProductQuery, enabled = true) {
  return useQuery({
    queryKey: catalogKeys.products(query),
    queryFn: () => catalogApi.getProducts(query),
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
    queryFn: ({ signal }) => catalogApi.getProductCollectors(productId, page, signal),
  });
}

export function useProductCardEffects(productId: number) {
  return useQuery({
    queryKey: catalogKeys.effects(productId),
    queryFn: ({ signal }) => catalogApi.getProductCardEffects(productId, signal),
  });
}
