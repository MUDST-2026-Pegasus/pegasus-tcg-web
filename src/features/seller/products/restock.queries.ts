import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as listingFormApi from "./listing-form.api";
import type { NewUnitsPayload } from "./listing-form.types";
import { listingKeys } from "./products.queries";

/**
 * บันทึกล็อตที่รับเข้า — หนึ่งคำขอ backend สร้างการ์ดทั้งล็อตในทรานแซกชันเดียว
 * จบแล้วดึงประกาศกับตารางใหม่ เพราะสต็อก (และสถานะ SOLD_OUT → ACTIVE) เปลี่ยนที่ backend
 */
export function useRestockListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: number; payload: NewUnitsPayload }) =>
      listingFormApi.addListingUnits(input.id, input.payload),
    onSettled: (_result, _error, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: listingKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) }),
      ]),
  });
}
