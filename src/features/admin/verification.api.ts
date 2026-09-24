import { api, type PageResponse } from "@/lib/api";

import type {
  RejectVerificationPayload,
  Verification,
  VerificationStatus,
} from "./verification.types";

/**
 * `/admin/verifications` — คิวตรวจ KYC ของผู้ดูแล (`AdminVerificationController.java`)
 * ทุก endpoint บังคับ role ADMIN ที่ backend อยู่แล้ว
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `verification.queries.ts`
 * response มี PII (ชื่อจริง, เลขบัญชี) ห้าม log ที่นี่หรือที่ไหนก็ตาม
 */

type QueueParams = {
  status: VerificationStatus;
  page: number;
  size: number;
};

/** backend เรียงเก่าสุดก่อนให้แล้ว ไม่ต้อง sort ซ้ำ (ต่างจากคิวฝั่งผู้ขาย) */
export function getVerificationQueue(
  params: QueueParams,
): Promise<PageResponse<Verification>> {
  return api.get<PageResponse<Verification>>("/admin/verifications", {
    query: { status: params.status, page: params.page, size: params.size },
  });
}

const LOOKUP_PAGE_SIZE = 50;

/**
 * ดึงใบเดียวใหม่ เพื่อขอ `bankBookImageUrl` ตัวใหม่ตอนตัวเดิมหมดอายุ
 *
 * backend ยังไม่มี `GET /admin/verifications/{id}` จึงไล่หาในคิวของสถานะนั้น
 * คิวที่ต้องไล่จริง ๆ คือ UNDER_REVIEW ซึ่งสั้นเสมอ (มีแค่ใบที่แอดมินกำลังตรวจ)
 *
 * @returns `null` เมื่อใบนั้นย้ายออกจากสถานะนี้ไปแล้ว
 */
export async function findVerification(
  verificationId: number,
  status: VerificationStatus,
): Promise<Verification | null> {
  for (let page = 0; ; page += 1) {
    const result = await getVerificationQueue({
      status,
      page,
      size: LOOKUP_PAGE_SIZE,
    });
    const found = result.items.find((item) => item.id === verificationId);
    if (found) {
      return found;
    }
    if (page + 1 >= result.totalPages) {
      return null;
    }
  }
}

/** จองคำขอ — กันแอดมินสองคนตรวจใบเดียวกัน ยิงตอนเปิดใบที่ยัง SUBMITTED */
export function startReview(verificationId: number): Promise<Verification> {
  return api.post<Verification>(
    `/admin/verifications/${verificationId}/start-review`,
  );
}

/** อนุมัติ — จุดเดียวที่ให้สิทธิ์ SELLER (ทำในทรานแซกชันเดียวฝั่ง backend) */
export function approveVerification(
  verificationId: number,
): Promise<Verification> {
  return api.post<Verification>(
    `/admin/verifications/${verificationId}/approve`,
  );
}

export function rejectVerification(
  verificationId: number,
  payload: RejectVerificationPayload,
): Promise<Verification> {
  return api.post<Verification>(
    `/admin/verifications/${verificationId}/reject`,
    payload,
  );
}
