import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as applicationApi from "./application.api";
import type { Verification } from "./application.types";

export const sellerApplicationKeys = {
  all: ["seller-application"] as const,
  verifications: () =>
    [...sellerApplicationKeys.all, "verifications"] as const,
};

/** คำขอล่าสุดของผู้ใช้ — `null` แปลว่ายังไม่เคยส่ง */
export function useLatestVerification() {
  return useQuery({
    queryKey: sellerApplicationKeys.verifications(),
    queryFn: applicationApi.getMyVerifications,
    select: (verifications) => verifications[0] ?? null,
  });
}

export function useSubmitVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applicationApi.submitVerification,
    onSuccess: (created) => {
      // สลับไปหน้าสถานะทันที ไม่ต้องรอ refetch
      queryClient.setQueryData<Verification[]>(
        sellerApplicationKeys.verifications(),
        (current = []) => [created, ...current],
      );
    },
    // VERIFICATION_IN_REVIEW ก็ต้องดึงใหม่ จะได้เห็นว่ามีคำขอค้างอยู่แล้ว
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: sellerApplicationKeys.all }),
  });
}
