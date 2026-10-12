/** ลอกมาจาก DTO ใน `com.pegasus.pegasustcgapi.dto` ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม */

export const ROLE_CODES = ["BUYER", "SELLER", "ADMIN", "SUPPORT"] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const SELF_ASSIGNABLE_ROLES = [
  "BUYER",
  "SELLER",
] as const satisfies readonly RoleCode[];

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  roles: RoleCode[];
  createdAt: string;
  lastLoginAt: string | null;
};

export type AuthTokens = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  /** ใช้ได้ครั้งเดียว พอ refresh แล้วได้ตัวใหม่มาแทน ต้องเก็บตัวใหม่เสมอ */
  refreshToken: string;
  refreshExpiresIn: number;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  displayName: string;
  password: string;
  phone?: string;
  /** ไม่ส่ง = ได้ BUYER เป็นค่าเริ่มต้นจาก backend */
  roles?: RoleCode[];
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type DevTokenResponse = {
  token?: string;
};
