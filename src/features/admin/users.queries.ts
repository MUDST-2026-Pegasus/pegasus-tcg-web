import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as usersApi from "./users.api";
import type {
  AdminUserListParams,
  RoleCode,
  UserStatus,
} from "./users.types";

/**
 * query key รวม params ทั้งก้อน — ทุก mutation ล้างที่ `all`
 * เพราะเปลี่ยนสถานะหรือบทบาทแล้วทั้งรายการและตัวเลขสรุปเปลี่ยนตาม
 */
export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (params: AdminUserListParams) =>
    [...adminUserKeys.all, "list", params] as const,
};

export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => usersApi.getAdminUsers(params),
    // เปลี่ยนหน้า/ตัวกรองแล้วยังเห็นของเดิมจนชุดใหม่มา ภาพไม่กระพริบ
    placeholderData: keepPreviousData,
  });
}

export type UserCounts = {
  total: number;
  sellers: number;
  suspended: number;
  isPending: boolean;
};

/** ตัวเลขบน subtitle — ยิง size=1 อ่านแค่ `totalItems` */
export function useUserCounts(): UserCounts {
  const filters: Omit<AdminUserListParams, "page" | "size">[] = [
    {},
    { role: "SELLER" },
    { status: "SUSPENDED" },
  ];
  return useQueries({
    queries: filters.map((filter) => {
      const params = { ...filter, page: 0, size: 1 };
      return {
        queryKey: adminUserKeys.list(params),
        queryFn: () => usersApi.getAdminUsers(params),
        select: (page: { totalItems: number }) => page.totalItems,
      };
    }),
    combine: (results) => ({
      total: results[0].data ?? 0,
      sellers: results[1].data ?? 0,
      suspended: results[2].data ?? 0,
      isPending: results.some((result) => result.isPending),
    }),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: UserStatus }) =>
      usersApi.updateUserStatus(userId, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
  });
}

export function useChangeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      role,
      grant,
    }: {
      userId: number;
      role: RoleCode;
      grant: boolean;
    }) =>
      grant ? usersApi.grantRole(userId, role) : usersApi.revokeRole(userId, role),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
  });
}
