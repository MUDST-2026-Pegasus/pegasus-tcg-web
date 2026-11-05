import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listingKeys } from "@/features/seller/products/products.queries";

import * as salesApi from "./sales.api";
import type { SellerSaleInput, SellerSaleStatus } from "./sales.types";

export const SELLER_SALE_PAGE_SIZE = 10;

/** ทุก mutation เปลี่ยนตาราง KPI และ listing ที่ล็อกราคา จึงล้างทั้ง `all` (รวมหน้าสินค้า) */
export const sellerSaleKeys = {
  all: ["seller-sales"] as const,
  list: (status: SellerSaleStatus | undefined, page: number) => [...sellerSaleKeys.all, "list", status, page] as const,
  summary: () => [...sellerSaleKeys.all, "summary"] as const,
  detail: (id: number) => [...sellerSaleKeys.all, "detail", id] as const,
  platform: () => [...sellerSaleKeys.all, "platform-listings"] as const,
  listings: () => [...sellerSaleKeys.all, "saleable-listings"] as const,
};

export function useSellerSales(status: SellerSaleStatus | undefined, page: number, enabled = true) {
  return useQuery({
    queryKey: sellerSaleKeys.list(status, page),
    queryFn: () => salesApi.getSellerSales(status, page, SELLER_SALE_PAGE_SIZE),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** แท็บหน้า "ลดราคาสินค้า N" */
export function useSellerSaleCount() {
  return useQuery({
    queryKey: sellerSaleKeys.list(undefined, -1),
    queryFn: () => salesApi.getSellerSales(undefined, 0, 1),
    select: (data) => data.page.totalItems,
  });
}

export function useSellerSaleSummary(enabled = true) {
  return useQuery({ queryKey: sellerSaleKeys.summary(), queryFn: salesApi.getSellerSaleSummary, enabled });
}

export function useSellerSale(id: number) {
  return useQuery({ queryKey: sellerSaleKeys.detail(id), queryFn: () => salesApi.getSellerSale(id), enabled: id > 0 });
}

export function usePlatformListings(enabled = true) {
  return useQuery({ queryKey: sellerSaleKeys.platform(), queryFn: salesApi.getPlatformListings, enabled });
}

export function useSaleableListings() {
  return useQuery({ queryKey: sellerSaleKeys.listings(), queryFn: salesApi.getSaleableListings, staleTime: 30_000 });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: listingKeys.all });
    return queryClient.invalidateQueries({ queryKey: sellerSaleKeys.all });
  };
}

export function useSaveSellerSale() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: SellerSaleInput }) =>
      id ? salesApi.updateSellerSale(id, input) : salesApi.createSellerSale(input),
    onSuccess: invalidate,
  });
}

export function useSellerSaleAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, kind }: { id: number; kind: "pause" | "resume" | "end" | "delete" }): Promise<unknown> => {
      if (kind === "pause") return salesApi.pauseSellerSale(id);
      if (kind === "resume") return salesApi.resumeSellerSale(id);
      if (kind === "end") return salesApi.endSellerSale(id);
      return salesApi.deleteSellerSale(id);
    },
    onSuccess: invalidate,
  });
}
