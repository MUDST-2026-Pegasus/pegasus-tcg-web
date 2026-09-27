/**
 * Payload สำหรับ `PUT /users/me`
 *
 * Backend null-semantics (ตาม TCG-364):
 * - `displayName`: อัปเดตชื่อแสดงผล (ห้ามเป็น whitespace ล้วน, ไม่ส่ง/null = คงเดิม)
 * - `phone` / `bio`: ค่า null/ไม่ส่ง = คงค่าเดิม, ค่า "" (empty string) = ล้างค่าเป็น NULL
 * - `avatarUrl`: objectKey ที่ได้จาก `useFileUpload` (purpose `AVATAR_IMAGE`),
 *               ค่า null/ไม่ส่ง = คงค่าเดิม, ค่า "" = ล้างรูปโปรไฟล์
 */
export type UpdateProfilePayload = {
  displayName?: string;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};
