import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as reviewsApi from "./reviews.api";

/** เปลี่ยนการแสดงหนึ่งรีวิว = ตัวเลข คะแนน และแท็บกรองเปลี่ยนทั้งหมด จึงล้างทั้งผู้ขาย */
export const reviewKeys = {
  all: ["admin-reviews"] as const,
  seller: (username: string) => [...reviewKeys.all, "seller", username] as const,
  profile: (username: string) => [...reviewKeys.all, "profile", username] as const,
};

export function useSellerReviews(username: string) {
  return useQuery({
    queryKey: reviewKeys.seller(username),
    queryFn: () => reviewsApi.getSellerReviews(username),
    enabled: Boolean(username),
    retry: false,
  });
}

export function useReviewSellerProfile(username: string) {
  return useQuery({
    queryKey: reviewKeys.profile(username),
    queryFn: () => reviewsApi.getSellerProfile(username),
    enabled: Boolean(username),
    retry: false,
  });
}

export function useSetReviewVisibility(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) =>
      reviewsApi.setReviewVisibility(id, visible),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKeys.seller(username) }),
        // หน้าโปรไฟล์สาธารณะของผู้ขาย (PublicSellerReviews) ใช้คีย์นี้
        queryClient.invalidateQueries({ queryKey: ["finance", "public-reviews", username] }),
      ]),
  });
}
