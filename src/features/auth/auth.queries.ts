import { useEffect, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clearSession,
  getSession,
  isApiError,
  saveSession,
  subscribeSession,
} from "@/lib/api";

import * as authApi from "./auth.api";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  RoleCode,
} from "./auth.types";

/**
 * token อยู่ใน localStorage ผ่าน `@/lib/api` ส่วนข้อมูลผู้ใช้อยู่ใน cache
 * ใต้คีย์ `authKeys.me()` — component ใช้ `useAuth()` อย่างเดียวก็พอ
 */

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useHasSession(): boolean {
  return useSyncExternalStore(
    subscribeSession,
    () => getSession() !== null,
    () => false,
  );
}

export function useCurrentUser() {
  const hasSession = useHasSession();

  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.getCurrentUser,
    enabled: hasSession,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const { isError, error } = query;

  useEffect(() => {
    // token ใช้ไม่ได้แล้ว หรือบัญชีถูกระงับ — ล้างทิ้งไม่ให้ค้างในสถานะกำกวม
    if (isError && isApiError(error) && (error.status === 401 || error.status === 403)) {
      clearSession();
    }
  }, [isError, error]);

  return query;
}

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** มี token แต่ยังรอผล `/auth/me` — ยังตัดสินไม่ได้ว่า login อยู่หรือเปล่า */
  isLoading: boolean;
  roles: RoleCode[];
  hasRole: (...roles: RoleCode[]) => boolean;
};

export function useAuth(): AuthState {
  const hasSession = useHasSession();
  const { data: user, isPending } = useCurrentUser();

  const roles = user?.roles ?? [];

  return {
    user: user ?? null,
    isAuthenticated: user !== undefined,
    isLoading: hasSession && isPending,
    roles,
    hasRole: (...wanted: RoleCode[]) => wanted.some((role) => roles.includes(role)),
  };
}

/** ล้าง cache เมื่อ session จบ กันข้อมูลคนก่อนหน้าค้างให้คนถัดไปเห็น */
export function useAuthSessionSync(): void {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeSession(() => {
        if (getSession() === null) {
          queryClient.removeQueries();
        }
      }),
    [queryClient],
  );
}

function useSessionMutation<TPayload>(
  mutationFn: (payload: TPayload) => Promise<AuthSession>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (session) => {
      saveSession(session.tokens);
      queryClient.setQueryData(authKeys.me(), session.user);
    },
  });
}

export function useLogin() {
  return useSessionMutation<LoginPayload>(authApi.login);
}

export function useRegister() {
  return useSessionMutation<RegisterPayload>(authApi.register);
}

export function useChangePassword() {
  return useSessionMutation<ChangePasswordPayload>(authApi.changePassword);
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = getSession()?.refreshToken;
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => undefined);
      }
    },
    onSettled: clearSession,
  });
}

export function useLogoutAll() {
  return useMutation({
    mutationFn: authApi.logoutAll,
    onSettled: clearSession,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
  });
}
