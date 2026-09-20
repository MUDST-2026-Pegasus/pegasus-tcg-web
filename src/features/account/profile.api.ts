import { api } from "@/lib/api";
import type { AuthUser } from "@/features/auth/auth.types";

import type { UpdateProfilePayload } from "./profile.types";

/**
 * แก้ไขข้อมูลส่วนตัวของผู้ใช้ที่ login อยู่ (`PUT /users/me`)
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `profile.queries.ts`
 */
export function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return api.put<AuthUser>("/users/me", payload);
}
