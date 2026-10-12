import { api } from "@/lib/api";

import type {
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  DevTokenResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "./auth.types";

/** component ไม่ควรเรียกไฟล์นี้ตรง ๆ ให้ผ่าน hook ใน `auth.queries.ts` */

/** endpoint สาธารณะ ไม่ต้องแนบ Authorization และ token เก่าอาจหมดอายุอยู่ */
const PUBLIC = { auth: false } as const;

export function register(payload: RegisterPayload): Promise<AuthSession> {
  return api.post<AuthSession>("/auth/register", payload, PUBLIC);
}

export function login(payload: LoginPayload): Promise<AuthSession> {
  return api.post<AuthSession>("/auth/login", payload, PUBLIC);
}

export function logout(refreshToken: string): Promise<void> {
  return api.post<void>("/auth/logout", { refreshToken }, PUBLIC);
}

export function logoutAll(): Promise<void> {
  return api.post<void>("/auth/logout-all");
}

export function getCurrentUser(): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me");
}

/** ตอบเหมือนกันทุกกรณี ไม่บอกว่าอีเมลนี้มีบัญชีอยู่จริงไหม */
export function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<DevTokenResponse> {
  return api.post<DevTokenResponse>("/auth/password/forgot", payload, PUBLIC);
}

export function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  return api.post<void>("/auth/password/reset", payload, PUBLIC);
}

export function changePassword(
  payload: ChangePasswordPayload,
): Promise<AuthSession> {
  return api.post<AuthSession>("/auth/password/change", payload);
}
