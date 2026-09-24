import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";

import type { PageResponse } from "@/lib/api";

import * as productsApi from "./products.api";
import type {
  ListingPricePayload,
  ListingQuery,
  ListingStatus,
  SellerListing,
  SellerListingSummary,
} from "./products.types";

/** เรียงตามลำดับชิปตัวกรองบนหน้าจัดการสินค้า */
export const LISTING_STATUSES: ListingStatus[] = [
  "ACTIVE",
  "SOLD_OUT",
  "PAUSED",
  "DRAFT",
  "DELISTED",
  "BLOCKED",
];

/**
 * query key ต้องรวมทุกค่าที่ทำให้ผลต่างกัน — ที่นี่คือ status/page/size
 * ตัวนับของแต่ละชิป (size=1) ก็อยู่ใต้ `lists()` ด้วย ล้างที่ `lists()` ทีเดียวได้ครบ
 */
export const listingKeys = {
  all: ["seller-listings"] as const,
  lists: () => [...listingKeys.all, "list"] as const,
  list: (query: ListingQuery) =>
    [
      ...listingKeys.lists(),
      query.status ?? "ALL",
      query.page,
      query.size,
    ] as const,
  details: () => [...listingKeys.all, "detail"] as const,
  detail: (id: number) => [...listingKeys.details(), id] as const,
};

/** หนึ่งหน้าของตาราง */
export function useMyListings(query: ListingQuery) {
  return useQuery({
    queryKey: listingKeys.list(query),
    queryFn: () => productsApi.getMyListings(query),
    // สลับหน้า/ตัวกรองแล้วยังเห็นของเดิมจนกว่าชุดใหม่จะมา ภาพไม่กระพริบ
    placeholderData: keepPreviousData,
  });
}

export type ListingCounts = {
  counts: Record<ListingStatus, number>;
  total: number;
  isPending: boolean;
};

/**
 * จำนวนจริงของแต่ละสถานะ — backend ไม่มี endpoint นับ จึงยิง size=1 แล้วอ่าน `totalItems`
 * "ทั้งหมด" คือผลรวม เพราะหนึ่งประกาศมีสถานะเดียวเสมอ ไม่ต้องยิงเพิ่ม
 */
export function useListingCounts(): ListingCounts {
  return useQueries({
    queries: LISTING_STATUSES.map((status) => {
      const query = { status, page: 0, size: 1 };
      return {
        queryKey: listingKeys.list(query),
        queryFn: () => productsApi.getMyListings(query),
        select: (page: PageResponse<SellerListingSummary>) => page.totalItems,
      };
    }),
    combine: (results) => {
      const counts = {} as Record<ListingStatus, number>;
      LISTING_STATUSES.forEach((status, index) => {
        counts[status] = results[index].data ?? 0;
      });
      return {
        counts,
        total: LISTING_STATUSES.reduce(
          (sum, status) => sum + counts[status],
          0,
        ),
        isPending: results.some((result) => result.isPending),
      };
    },
  });
}

/** ประกาศเต็มก้อนทีละใบ */
export function useMyListing(id: number) {
  return useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: () => productsApi.getMyListing(id),
  });
}

type ListSnapshot = [
  QueryKey,
  PageResponse<SellerListingSummary> | undefined,
][];

/**
 * แก้แถวในทุกหน้าที่ cache ไว้ก่อนรอ backend ตอบ แล้วคืนของเดิมไว้ให้ย้อนตอนพลาด
 * ต้อง cancel ก่อน ไม่งั้น refetch ที่ค้างอยู่จะเขียนของเก่าทับค่าที่เพิ่งแก้
 */
async function patchCachedRows(
  queryClient: QueryClient,
  id: number,
  patch: Partial<SellerListingSummary>,
): Promise<ListSnapshot> {
  await queryClient.cancelQueries({ queryKey: listingKeys.lists() });
  const snapshot = queryClient.getQueriesData<
    PageResponse<SellerListingSummary>
  >({
    queryKey: listingKeys.lists(),
  });
  queryClient.setQueriesData<PageResponse<SellerListingSummary>>(
    { queryKey: listingKeys.lists() },
    (page) =>
      page && {
        ...page,
        items: page.items.map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      },
  );
  return snapshot;
}

function restoreRows(
  queryClient: QueryClient,
  snapshot: ListSnapshot | undefined,
) {
  snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

/**
 * ทุก mutation จบด้วยการดึงใหม่ทั้งหน้าและตัวนับ — ค่าที่เดาไว้ล่วงหน้าอาจไม่ตรงของจริง
 * เช่น เปิดขายประกาศ PAUSED ที่ไม่เหลือการ์ด backend ย้ายไป SOLD_OUT แทน ACTIVE
 */
function settle(queryClient: QueryClient, id: number, updated?: SellerListing) {
  if (updated) {
    queryClient.setQueryData(listingKeys.detail(id), updated);
  }
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: listingKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) }),
  ]);
}

export function useChangeListingPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: ListingPricePayload }) =>
      productsApi.changeListingPrice(input.id, input.payload),
    onMutate: ({ id, payload }) =>
      patchCachedRows(queryClient, id, {
        pricingMode: payload.pricingMode,
        ...(payload.price !== undefined ? { price: payload.price } : {}),
      }),
    onError: (_error, _input, snapshot) => restoreRows(queryClient, snapshot),
    onSettled: (updated, _error, { id }) => settle(queryClient, id, updated),
  });
}

export function useChangeListingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; status: ListingStatus }) =>
      productsApi.changeListingStatus(input.id, input.status),
    onMutate: ({ id, status }) => patchCachedRows(queryClient, id, { status }),
    onError: (_error, _input, snapshot) => restoreRows(queryClient, snapshot),
    onSettled: (updated, _error, { id }) => settle(queryClient, id, updated),
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productsApi.deleteListing(id),
    onSuccess: (_result, id) =>
      queryClient.removeQueries({ queryKey: listingKeys.detail(id) }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() }),
  });
}
