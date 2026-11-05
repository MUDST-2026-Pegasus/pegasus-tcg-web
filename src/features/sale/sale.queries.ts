import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import * as saleApi from "./sale.api";
import type { SaleListingQuery } from "./sale.types";

export const SALE_GRID_PAGE_SIZE = 10;

export const saleKeys = {
  all: ["sales"] as const,
  list: () => [...saleKeys.all, "list"] as const,
  featured: () => [...saleKeys.all, "featured"] as const,
  listings: (slug: string | null, query: SaleListingQuery) => [...saleKeys.all, "listings", slug, query] as const,
};

/** แคมเปญที่กำลังลด — ใช้ร่วมกันระหว่างแท็บหน้า SALE กับเมนู SALE บน Navbar */
export function useSales() {
  return useQuery({ queryKey: saleKeys.list(), queryFn: saleApi.getSales, staleTime: 60_000 });
}

export function useFeaturedSales() {
  return useQuery({ queryKey: saleKeys.featured(), queryFn: saleApi.getFeaturedSales, staleTime: 30_000 });
}

/**
 * listing ที่ลดราคา แบ่งหน้าแบบ "โหลดเพิ่ม"
 * `slug = null` → ทุกอย่างที่ลด (`/search?onSale=true`) · มี slug → `/sales/{slug}` (ได้หัวแคมเปญด้วย)
 */
export function useSaleListings(slug: string | null, query: SaleListingQuery) {
  return useInfiniteQuery({
    queryKey: saleKeys.listings(slug, query),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const pageQuery = { ...query, page: pageParam, size: SALE_GRID_PAGE_SIZE };
      if (slug) {
        const detail = await saleApi.getSaleDetail(slug, pageQuery);
        return { sale: detail.sale, page: detail.listings };
      }
      return { sale: null, page: await saleApi.searchOnSale(pageQuery) };
    },
    getNextPageParam: (last) => (last.page.page + 1 < last.page.totalPages ? last.page.page + 1 : undefined),
  });
}
