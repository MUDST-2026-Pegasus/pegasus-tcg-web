import { useQuery } from "@tanstack/react-query";

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
 */

export const HOME_PRODUCT_COUNT = 10;
const RAIL_COUNT = 10;

export const homeKeys = {
  all: ["home"] as const,
  banners: () => [...homeKeys.all, "banners"] as const,
  games: () => [...homeKeys.all, "games"] as const,
  categories: () => [...homeKeys.all, "categories"] as const,
  newReleases: () => [...homeKeys.all, "new-releases"] as const,
  trending: () => [...homeKeys.all, "trending"] as const,
  pegasusPicks: (username: string) =>
    [...homeKeys.all, "pegasus-picks", username] as const,
  explore: () => [...homeKeys.all, "explore"] as const,
};

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
    queryKey: homeKeys.games(),
    queryFn: homeApi.getGames,
    select: (games) => games.map(toGameCategory),
  });
}

export function useFeaturedCategories() {
  return useQuery({
    queryKey: homeKeys.categories(),
    queryFn: homeApi.getCategories,
    select: toFeaturedCategories,
  });
}

/** ของใหม่ที่ซื้อได้ตอนนี้ 10 ชิ้นแรก */
export function useNewReleases() {
  return useQuery({
    queryKey: homeKeys.newReleases(),
    queryFn: () =>
      homeApi.getProducts({
        sort: "newest",
        inStock: true,
        size: HOME_PRODUCT_COUNT,
      }),
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

/** Pegasus Picks คือหน้าร้านของบัญชีร้าน Pegasus เอง */
export function usePegasusPicks() {
  const username = env.pegasusStoreUsername;
  return useQuery({
    queryKey: homeKeys.pegasusPicks(username),
    queryFn: () => homeApi.getStorefront(username, RAIL_COUNT),
    select: (page) => page.items.map(listingToHomeProduct),
  });
}

/** หน้าถัดจาก New Releases — ไม่ซ้ำกับแถวบนสุด */
export function useExploreMore() {
  return useQuery({
    queryKey: homeKeys.explore(),
    queryFn: () =>
      homeApi.getProducts({
        sort: "newest",
        inStock: true,
        page: 1,
        size: HOME_PRODUCT_COUNT,
      }),
    select: (page) => page.items.map(toHomeProduct),
  });
}
