import { api, isApiError } from "@/lib/api";

import type { AdminReview, ReviewRecord, ReviewSellerProfile } from "./reviews.types";

/**
 * หน้า "จัดการรีวิว" — ฟังก์ชันเปล่า ๆ หนึ่งตัวต่อหนึ่ง endpoint
 * backend ยังไม่แบ่งหน้า รายการทั้งหมดของผู้ขายมาในคำขอเดียว
 */

export function getSellerReviews(username: string) {
  return api.get<AdminReview[]>("/admin/reviews", { query: { username } });
}

export function setReviewVisibility(id: number, visible: boolean) {
  return api.put<ReviewRecord>(`/admin/reviews/${id}/visibility`, { visible });
}

/**
 * โปรไฟล์สาธารณะของผู้ขาย — บัญชีที่ถูกระงับไม่มีหน้าสาธารณะ (404)
 * ไม่ถือเป็น error ของหน้านี้ การ์ดแค่ไม่มีชื่อร้าน
 */
export async function getSellerProfile(username: string): Promise<ReviewSellerProfile | null> {
  try {
    return await api.get<ReviewSellerProfile>(`/u/${encodeURIComponent(username)}`, { auth: false });
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}
