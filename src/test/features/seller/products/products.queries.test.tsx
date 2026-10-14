import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "@/features/seller/dashboard/dashboard.queries";
import * as listingFormApi from "@/features/seller/products/listing-form.api";
import { useCreateListing, useUpdateListing } from "@/features/seller/products/listing-form.queries";
import type { CreateListingPayload } from "@/features/seller/products/listing-form.types";
import * as productsApi from "@/features/seller/products/products.api";
import {
  listingKeys,
  useBulkListingUpdate,
  useChangeListingPrice,
  useChangeListingStatus,
  useDeleteListing,
} from "@/features/seller/products/products.queries";
import type { SellerListing } from "@/features/seller/products/products.types";
import { useRestockListing } from "@/features/seller/products/restock.queries";
import { createTestQueryClient } from "@/test/utils";

vi.mock("@/features/seller/products/products.api", () => ({
  getMyListing: vi.fn(),
  changeListingPrice: vi.fn(),
  changeListingStatus: vi.fn(),
  deleteListing: vi.fn(),
}));
vi.mock("@/features/seller/products/listing-form.api", () => ({
  createListing: vi.fn(),
  addListingUnits: vi.fn(),
  updateListingDetails: vi.fn(),
}));

const listing = { id: 7, status: "PAUSED" } as SellerListing;
const units = { quantity: 2, unitCost: 100 };

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** แดชบอร์ดกับหน้าตารางที่เคยเปิดไว้ — ไม่มีใคร subscribe อยู่ เหมือนตอนผู้ขายอยู่หน้าอื่น */
function seedCachedViews() {
  queryClient.setQueryData(dashboardKeys.month(undefined), { listings: { active: 42 } });
  queryClient.setQueryData(listingKeys.list({ page: 0, size: 20 }), { items: [] });
}

function isStale(queryKey: readonly unknown[]) {
  return queryClient.getQueryState(queryKey)?.isInvalidated;
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = createTestQueryClient();
  vi.mocked(productsApi.changeListingPrice).mockResolvedValue(listing);
  vi.mocked(productsApi.changeListingStatus).mockResolvedValue(listing);
  vi.mocked(productsApi.deleteListing).mockResolvedValue(undefined);
  vi.mocked(productsApi.getMyListing).mockResolvedValue(listing);
  vi.mocked(listingFormApi.createListing).mockResolvedValue(listing);
  vi.mocked(listingFormApi.addListingUnits).mockResolvedValue([]);
});

/**
 * ทุกการกระทำของผู้ขายที่แก้ประกาศ — แต่ละอันคืนฟังก์ชันที่ยิง mutation หนึ่งครั้ง
 * แดชบอร์ดนับจากประกาศ (สินค้าที่ลงขาย, สต็อกใกล้หมด) จึงต้องถูกทำเครื่องหมายว่าเก่าทุกครั้ง
 */
const listingChanges: [string, () => () => Promise<unknown>][] = [
  [
    "changing a price",
    () => {
      const { result } = renderHook(() => useChangeListingPrice(), { wrapper });
      return () => result.current.mutateAsync({ id: 7, payload: { pricingMode: "MANUAL", price: 120 } });
    },
  ],
  [
    "pausing or publishing",
    () => {
      const { result } = renderHook(() => useChangeListingStatus(), { wrapper });
      return () => result.current.mutateAsync({ id: 7, status: "PAUSED" });
    },
  ],
  [
    "deleting",
    () => {
      const { result } = renderHook(() => useDeleteListing(), { wrapper });
      return () => result.current.mutateAsync(7);
    },
  ],
  [
    "a bulk change",
    () => {
      const { result } = renderHook(() => useBulkListingUpdate(), { wrapper });
      return () => result.current.mutateAsync([{ id: 7, status: "PAUSED" }]);
    },
  ],
  [
    "listing a new card",
    () => {
      const { result } = renderHook(() => useCreateListing(), { wrapper });
      return () =>
        result.current.mutateAsync({ listing: {} as CreateListingPayload, units, publish: true });
    },
  ],
  [
    "saving the edit page",
    () => {
      const { result } = renderHook(() => useUpdateListing(7), { wrapper });
      return () =>
        result.current.mutateAsync({ details: null, price: { pricingMode: "MANUAL", price: 120 } });
    },
  ],
  [
    "restocking",
    () => {
      const { result } = renderHook(() => useRestockListing(), { wrapper });
      return () => result.current.mutateAsync({ id: 7, payload: units });
    },
  ],
];

describe("after a seller changes a listing", () => {
  it.each(listingChanges)("refreshes the dashboard after %s", async (_name, setup) => {
    seedCachedViews();
    const run = setup();

    await run();

    expect(isStale(dashboardKeys.month(undefined))).toBe(true);
    // ตารางสินค้าต้องดึงใหม่เหมือนเดิม
    expect(isStale(listingKeys.list({ page: 0, size: 20 }))).toBe(true);
  });
});
