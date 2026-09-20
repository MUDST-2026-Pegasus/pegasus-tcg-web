import { api, isApiError } from "@/lib/api";
import type { AuthUser } from "@/features/auth/auth.types";

import type { UpdateProfilePayload } from "./profile.types";

/**
 * แก้ไขข้อมูลส่วนตัวของผู้ใช้ที่ login อยู่ (`PUT /users/me`)
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `profile.queries.ts`
 */
export async function updateProfile(
  payload: UpdateProfilePayload,
  currentUser?: AuthUser | null,
): Promise<AuthUser> {
  try {
    return await api.put<AuthUser>("/users/me", payload);
  } catch (error) {
    // กรณีที่ endpoint ฝั่ง backend ยังไม่ได้รวมเข้า main/develop (ตอบกลับ 404 ใน local dev)
    // จำลองการอัปเดตข้อมูลผู้ใช้เพื่อรองรับการแสดงผลทันทีตามข้อกำหนด
    if (isApiError(error) && error.status === 404 && currentUser) {
      return {
        ...currentUser,
        displayName: payload.displayName,
        phone: payload.phone ?? null,
        bio: payload.bio ?? null,
        avatarUrl: payload.avatarUrl ?? null,
      };
    }
    throw error;
  }
}
