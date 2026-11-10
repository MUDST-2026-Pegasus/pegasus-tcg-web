import { api, type FileDownload, type PageResponse } from "@/lib/api";

import type {
  AdminUser,
  AdminUserListParams,
  RoleCode,
  UserStatus,
} from "./users.types";

/**
 * `/admin/users` (`AdminUserController.java`) — ค้นหา อ่าน และระงับบัญชี
 * `/users/{id}/roles` (`UserRoleController.java`) — ให้/ถอนบทบาท
 * ทุก endpoint บังคับ role ADMIN ที่ backend · response มี PII ห้าม log
 */

/** ใหม่สุดก่อน */
export function getAdminUsers(
  params: AdminUserListParams,
): Promise<PageResponse<AdminUser>> {
  return api.get<PageResponse<AdminUser>>("/admin/users", {
    query: {
      q: params.q?.trim() || undefined,
      role: params.role,
      status: params.status,
      page: params.page,
      size: params.size,
    },
  });
}

/**
 * CSV ผู้ใช้ทุกคนที่ตรงตัวกรอง ไม่ใช่แค่หน้าที่เปิดอยู่ [TCG-747/749]
 * อีเมลถูกปิดบังจาก backend · เกิน 20,000 แถวได้ 400 `EXPORT_TOO_LARGE`
 */
export function downloadAdminUsersCsv(
  params: Omit<AdminUserListParams, "page" | "size">,
): Promise<FileDownload> {
  return api.download("/admin/users/export", {
    query: {
      q: params.q?.trim() || undefined,
      role: params.role,
      status: params.status,
    },
    headers: { Accept: "text/csv, application/json" },
  });
}

/** ไม่พบ id นี้ — backend ตอบ 404 `USER_NOT_FOUND` */
export function getAdminUser(userId: number): Promise<AdminUser> {
  return api.get<AdminUser>(`/admin/users/${userId}`);
}

/** แอดมินเปลี่ยนสถานะตัวเองไม่ได้ — backend ตอบ 403 `ACCESS_DENIED` */
export function updateUserStatus(
  userId: number,
  status: UserStatus,
): Promise<AdminUser> {
  return api.patch<AdminUser>(`/admin/users/${userId}/status`, { status });
}

/** ได้บทบาทชุดใหม่ทั้งหมดกลับมา มีผลกับ access token รอบถัดไปของคนนั้น */
export function grantRole(userId: number, role: RoleCode): Promise<RoleCode[]> {
  return api.post<RoleCode[]>(`/users/${userId}/roles`, { role });
}

/** ถอน ADMIN ของตัวเองไม่ได้ — backend ตอบ 403 `ACCESS_DENIED` */
export function revokeRole(userId: number, role: RoleCode): Promise<RoleCode[]> {
  return api.delete<RoleCode[]>(`/users/${userId}/roles/${role}`);
}
