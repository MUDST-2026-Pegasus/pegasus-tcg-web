import { keepPreviousData, useQuery } from "@tanstack/react-query";

import * as catalogApi from "./catalog.api";
import type { ProductQuery } from "./catalog.types";

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
