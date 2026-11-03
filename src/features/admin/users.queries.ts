import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as usersApi from "./users.api";
import type {
  AdminUser,
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
  detail: (userId: number) => [...adminUserKeys.all, "detail", userId] as const,
};

export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => usersApi.getAdminUsers(params),
    // เปลี่ยนหน้า/ตัวกรองแล้วยังเห็นของเดิมจนชุดใหม่มา ภาพไม่กระพริบ
    placeholderData: keepPreviousData,
  });
}

/**
 * รายละเอียดบัญชีเดียวสำหรับ Sidebar — `null` = ปิดอยู่ ไม่ยิง
 * `preview` คือแถวที่คลิกจากตาราง ใช้แสดงไปก่อนระหว่างรอของจริง
 */
export function useAdminUser(userId: number | null, preview?: AdminUser) {
  return useQuery({
    queryKey: adminUserKeys.detail(userId ?? 0),
    queryFn: () => usersApi.getAdminUser(userId as number),
    enabled: userId !== null,
    placeholderData: preview && preview.id === userId ? preview : undefined,
  });
}

/** ช่องค้นใน dialog "เพิ่มผู้ดูแล" — ไม่ยิงจนกว่าจะพิมพ์ */
export const USER_SEARCH_SIZE = 5;

export function useUserSearch(q: string) {
  const params = { q: q.trim(), page: 0, size: USER_SEARCH_SIZE };
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => usersApi.getAdminUsers(params),
    enabled: params.q.length > 0,
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

export type RoleChange = { role: RoleCode; grant: boolean };

/**
 * บันทึกจาก dialog "จัดการบทบาท" — ยิงทีละบทบาทที่เปลี่ยนตามลำดับ
 * พังกลางทางก็หยุดตรงนั้น แล้วล้าง cache ให้หน้าเห็นสถานะจริงจาก backend
 */
export function useUpdateRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, changes }: { userId: number; changes: RoleChange[] }) => {
      for (const { role, grant } of changes) {
        await (grant ? usersApi.grantRole(userId, role) : usersApi.revokeRole(userId, role));
      }
    },
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
