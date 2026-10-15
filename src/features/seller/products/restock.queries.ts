import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import * as listingFormApi from "./listing-form.api";
import type { NewUnitsPayload } from "./listing-form.types";
import { invalidateListingViews, listingKeys } from "./products.queries";
import type { CardCondition } from "./products.types";

export const stockInKeys = {
  all: [...listingKeys.all, "stock-ins"] as const,
  market: (variantId: number, condition: CardCondition) =>
    [...stockInKeys.all, variantId, condition] as const,
};

/**
 * ประวัติรับเข้าของการ์ดพิมพ์นี้ในสภาพนี้ — ทีละ 20 ล็อต กด "ดูเพิ่ม" ได้หน้าถัดไป
 * ยอดรับเข้า / ขายแล้วเป็นของทุกหน้า อ่านจากหน้าแรกได้เลย
 */
export function useStockIns(variantId: number, condition: CardCondition) {
  return useInfiniteQuery({
    queryKey: stockInKeys.market(variantId, condition),
    queryFn: ({ pageParam }) => listingFormApi.getStockIns(variantId, condition, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.lots.page + 1 < last.lots.totalPages ? last.lots.page + 1 : undefined,
  });
}

/**
 * บันทึกล็อตที่รับเข้า — หนึ่งคำขอ backend สร้างการ์ดทั้งล็อตในทรานแซกชันเดียว
 * จบแล้วดึงประกาศ ตาราง และประวัติรับเข้าใหม่ เพราะสต็อก (และสถานะ SOLD_OUT → ACTIVE) เปลี่ยนที่ backend
 */
export function useRestockListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: NewUnitsPayload }) =>
      listingFormApi.addListingUnits(input.id, input.payload),
    onSettled: (_result, _error, { id }) =>
      Promise.all([
        invalidateListingViews(queryClient, listingKeys.detail(id)),
        queryClient.invalidateQueries({ queryKey: stockInKeys.all }),
      ]),
  });
}
