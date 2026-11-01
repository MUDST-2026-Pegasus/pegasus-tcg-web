/**
 * ลอกจาก `dto/UserResponse.java`, `model/RoleCode.java`, `model/UserStatus.java`
 * และ `dto/UpdateUserStatusRequest.java` ของ pegasus-tcg-api
 * (`/admin/users` มาจาก TCG-423) ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 */

export type RoleCode = "BUYER" | "SELLER" | "ADMIN" | "SUPPORT";

/** ออกจาก ACTIVE เมื่อไหร่ backend เพิกถอน refresh token ทั้งหมดของคนนั้นทันที */
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

/** มี PII (อีเมล เบอร์โทร) — ห้าม log ห้ามใส่ URL */
export type AdminUser = {
  id: number;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  phone: string | null;
  /** เจ้าของบัญชีเลือกให้เบอร์โทรขึ้นบนหน้าร้านสาธารณะหรือไม่ */
  phonePublic: boolean;
  /** presigned GET อายุสั้น ห้ามเก็บ */
  avatarUrl: string | null;
  status: UserStatus;
  roles: RoleCode[];
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminUserListParams = {
  /** ค้นในอีเมล username และชื่อที่แสดง */
  q?: string;
  role?: RoleCode;
  status?: UserStatus;
  page: number;
  size: number;
};
