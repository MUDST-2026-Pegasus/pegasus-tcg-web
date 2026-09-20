import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authKeys, useAuth } from "@/features/auth/auth.queries";
import type { AuthUser } from "@/features/auth/auth.types";

import * as profileApi from "./profile.api";
import type { UpdateProfilePayload } from "./profile.types";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileApi.updateProfile(payload, user),
    onSuccess: (updatedUser) => {
      // เขียนทับ cache ของ authKeys.me ทันที และสั่ง invalidate เพื่อให้ทุกหน้า sync
      queryClient.setQueryData(authKeys.me(), (old: AuthUser | undefined) =>
        old ? { ...old, ...updatedUser } : updatedUser,
      );
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
