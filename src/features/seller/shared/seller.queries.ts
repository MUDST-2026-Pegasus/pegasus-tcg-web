import { useQuery } from "@tanstack/react-query";

import * as sellerApi from "./seller.api";
import { publishBlockedReason } from "./seller.format";
import { translate } from "@/lib/i18n";

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

export type PublishPermission = {
  canPublish: boolean;
  /** ทำไมกดไม่ได้ — `null` เมื่อ `canPublish` */
  reason: string | null;
};

/**
 * ตอนนี้ลงขายหรือแก้ประกาศได้ไหม — ระหว่างโหลดหรือโหลดไม่สำเร็จถือว่ายังไม่ได้
 * ปิดปุ่มไว้ก่อนดีกว่าปล่อยให้กดแล้วโดน `SELLER_NOT_VERIFIED`
 */
export function usePublishPermission(): PublishPermission {
  const { data: profile, isError } = useSellerProfile();

  if (profile === undefined) {
    return {
      canPublish: false,
      reason: isError ? translate("seller", "publishBlocked.loadFailed", "โหลดสถานะร้านไม่สำเร็จ") : translate("seller", "publishBlocked.checking", "กำลังตรวจสอบสถานะร้าน"),
    };
  }
  return {
    canPublish: profile?.canPublish ?? false,
    reason: publishBlockedReason(profile),
  };
}

// translate() อยู่นอก component — ประกาศ key ให้ tolgee CLI เห็น [TCG-554]
// @tolgee-key {"key": "publishBlocked.loadFailed", "ns": "seller", "defaultValue": "โหลดสถานะร้านไม่สำเร็จ"}
// @tolgee-key {"key": "publishBlocked.checking", "ns": "seller", "defaultValue": "กำลังตรวจสอบสถานะร้าน"}
