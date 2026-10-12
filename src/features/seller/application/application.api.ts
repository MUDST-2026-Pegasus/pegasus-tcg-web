import { api, hasErrorCode } from "@/lib/api";

import type { Verification, VerificationPayload } from "./application.types";

/** component ไม่ควรเรียกไฟล์นี้ตรง ๆ ให้ผ่าน hook ใน `application.queries.ts` */

/** เรียงคำขอใหม่สุดขึ้นก่อน */
export async function getMyVerifications(): Promise<Verification[]> {
  try {
    const verifications = await api.get<Verification[]>(
      "/sellers/me/verifications",
    );
    return [...verifications].sort(
      (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
    );
  } catch (error) {
    // ยังไม่เคยสมัคร = ยังไม่มี seller profile ถือว่ายังไม่มีคำขอ
    if (hasErrorCode(error, "SELLER_NOT_FOUND")) {
      return [];
    }
    throw error;
  }
}

export function submitVerification(
  payload: VerificationPayload,
): Promise<Verification> {
  return api.post<Verification>("/sellers/me/verifications", payload);
}
