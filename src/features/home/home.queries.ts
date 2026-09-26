import { useQuery } from "@tanstack/react-query";

import * as catalogApi from "@/features/catalog/catalog.api";
import { catalogKeys } from "@/features/catalog/catalog.queries";
import type { ProductQuery } from "@/features/catalog/catalog.types";
import { hasErrorCode } from "@/lib/api";
import { env } from "@/lib/env";

import * as homeApi from "./home.api";
import {
  listingToHomeProduct,
  toFeaturedCategories,
  toGameCategory,
  toHeroSlide,
  toHomeProduct,
  toTrendingProduct,
} from "./home.mappers";
import type { HeroSlide } from "./home.types";

/**
 * หนึ่ง query ต่อหนึ่ง section — section ไหนโหลดไม่ขึ้นก็เสียแค่ section นั้น
 * ไม่ลากทั้งหน้าลงไปด้วย
 *
 * รูปทุกรูปเป็น presigned URL อายุ 15 นาที จึงไม่ตั้ง staleTime ยาวกว่าค่ากลาง
 *
 * เกม หมวดหมู่ และรายการสินค้าแคชใต้ `catalogKeys` ร่วมกับหน้าค้นหา
 */

export const HOME_PRODUCT_COUNT = 10;
const RAIL_COUNT = 10;

export const homeKeys = {
  all: ["home"] as const,
  banners: () => [...homeKeys.all, "banners"] as const,
  trending: () => [...homeKeys.all, "trending"] as const,
  pegasusPicks: (username: string) =>
    [...homeKeys.all, "pegasus-picks", username] as const,
};

const NEW_RELEASES: ProductQuery = {
  sort: "newest",
  inStock: true,
  size: HOME_PRODUCT_COUNT,
};

/** หน้าถัดจาก New Releases — ไม่ซ้ำกับแถวบนสุด */
const EXPLORE_MORE: ProductQuery = { ...NEW_RELEASES, page: 1 };

export function useHeroSlides() {
  return useQuery({
    queryKey: homeKeys.banners(),
    queryFn: homeApi.getBanners,
    select: (banners) =>
      banners
        .map(toHeroSlide)
        .filter((slide): slide is HeroSlide => slide !== null),
  });
}

export function useGames() {
  return useQuery({
    queryKey: catalogKeys.games(),
    queryFn: catalogApi.getGames,
    select: (games) => games.map(toGameCategory),
  });
}

export function useFeaturedCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: catalogApi.getCategories,
    select: toFeaturedCategories,
  });
}

/** ของใหม่ที่ซื้อได้ตอนนี้ 10 ชิ้นแรก */
export function useNewReleases() {
  return useQuery({
    queryKey: catalogKeys.products(NEW_RELEASES),
    queryFn: () => catalogApi.getProducts(NEW_RELEASES),
    select: (page) => page.items.map(toHomeProduct),
  });
}

export function useTrending() {
  return useQuery({
    queryKey: homeKeys.trending(),
    queryFn: () => homeApi.getTrending(RAIL_COUNT),
    select: (entries) => entries.map(toTrendingProduct),
  });
}

/**
 * Pegasus Picks คือหน้าร้านของบัญชีร้าน Pegasus เอง
 *
 * ที่ไหนยังไม่มีบัญชีนี้ (ยังไม่ได้ seed หรือยังไม่ได้เปิดร้าน) backend ตอบ `USER_NOT_FOUND`
 * — นับเป็นร้านว่าง section จะซ่อนไปเอง ไม่ขึ้นกล่อง error ค้างไว้ในหน้าแรก
 */
export function usePegasusPicks() {
  const username = env.pegasusStoreUsername;
  return useQuery({
    queryKey: homeKeys.pegasusPicks(username),
    queryFn: async () => {
      try {
        return await homeApi.getStorefront(username, RAIL_COUNT);
      } catch (error) {
        if (hasErrorCode(error, "USER_NOT_FOUND")) {
          return { items: [], page: 0, size: RAIL_COUNT, totalItems: 0, totalPages: 0 };
        }
        throw error;
      }
    },
    select: (page) => page.items.map(listingToHomeProduct),
  });
}

export function useExploreMore() {
  return useQuery({
    queryKey: catalogKeys.products(EXPLORE_MORE),
    queryFn: () => catalogApi.getProducts(EXPLORE_MORE),
    select: (page) => page.items.map(toHomeProduct),
  });
}
