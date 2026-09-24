import { useQuery } from "@tanstack/react-query";

import * as sellerApi from "./seller.api";

export const sellerKeys = {
  all: ["seller"] as const,
  profile: () => [...sellerKeys.all, "profile"] as const,
};

/**
 * สถานะร้านของผู้ขายที่ login อยู่ — ทุกหน้าใต้ `/seller/*` อ่านจาก cache ก้อนเดียวกันนี้
 * ผ่าน `SellerLayout` จึงยิงจริงแค่ครั้งเดียวต่อรอบ
 */
export function useSellerProfile() {
  return useQuery({
    queryKey: sellerKeys.profile(),
    queryFn: sellerApi.getSellerProfile,
  });
}
