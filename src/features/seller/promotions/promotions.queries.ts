import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerPromotionApi } from "./promotions.api";
import type { PromotionStatus, SellerPromotionInput } from "./promotions.types";

export const sellerPromotionKeys = {
  all: ["seller-promotions"] as const,
  list: (status: PromotionStatus | "ALL", page: number) =>
    [...sellerPromotionKeys.all, "list", status, page] as const,
  summary: () => [...sellerPromotionKeys.all, "summary"] as const,
  redemptions: (id: number, page: number) =>
    [...sellerPromotionKeys.all, "redemptions", id, page] as const,
};

export function useSellerPromotions(status: PromotionStatus | "ALL", page: number) {
  return useQuery({
    queryKey: sellerPromotionKeys.list(status, page),
    queryFn: () => sellerPromotionApi.list(status === "ALL" ? undefined : status, page),
    placeholderData: keepPreviousData,
  });
}

export function useSellerPromotionSummary() {
  return useQuery({ queryKey: sellerPromotionKeys.summary(), queryFn: sellerPromotionApi.summary });
}

export function useSellerRedemptions(id: number | null, page: number) {
  return useQuery({
    queryKey: sellerPromotionKeys.redemptions(id ?? 0, page),
    queryFn: () => sellerPromotionApi.redemptions(id!, page),
    enabled: id != null,
    // เปลี่ยนหน้าแล้วตารางไม่กระพริบ แต่ถ้าเปิดโค้ดอื่นต้องไม่เห็นแถวของโค้ดก่อนหน้า
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[2] === id ? previous : undefined),
  });
}

function usePromotionMutation<TVariables>(mutationFn: (value: TVariables) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    // รวมตอน error ด้วย: 409 (`PROMO_PAUSED`, `PROMO_IN_USE`) แปลว่าสถานะบน server เปลี่ยนไปแล้ว
    onSettled: () => client.invalidateQueries({ queryKey: sellerPromotionKeys.all }),
  });
}

export const useCreateSellerPromotion = () =>
  usePromotionMutation((input: SellerPromotionInput) => sellerPromotionApi.create(input));
export const useUpdateSellerPromotion = () =>
  usePromotionMutation(({ id, input }: { id: number; input: SellerPromotionInput }) =>
    sellerPromotionApi.update(id, input));
export const usePauseSellerPromotion = () =>
  usePromotionMutation((id: number) => sellerPromotionApi.pause(id));
export const useResumeSellerPromotion = () =>
  usePromotionMutation((id: number) => sellerPromotionApi.resume(id));
export const useDeleteSellerPromotion = () =>
  usePromotionMutation((id: number) => sellerPromotionApi.remove(id));
