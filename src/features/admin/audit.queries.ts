import { keepPreviousData, useQuery } from "@tanstack/react-query";

import * as auditApi from "./audit.api";
import type { AuditLogParams } from "./audit.types";

/**
 * query key รวม params ทั้งก้อน — log เขียนจากฝั่ง backend อย่างเดียว
 * หน้าเว็บไม่มี mutation ของตัวเอง แต่ action อื่นของแอดมินควรล้าง `all` หลังทำเสร็จ
 * ถ้าอยากให้หน้านี้เห็นทันที (ปล่อยให้ staleTime ปกติจัดการก็ได้)
 */
export const auditKeys = {
  all: ["admin-audit"] as const,
  list: (params: AuditLogParams) => [...auditKeys.all, "list", params] as const,
  summary: (from?: string, to?: string) => [...auditKeys.all, "summary", from ?? null, to ?? null] as const,
};

/** ใช้ทั้งหน้าบันทึกกิจกรรมและการ์ด "กิจกรรมล่าสุด" ในหน้าภาพรวม (`{ page: 0, size: 5 }`) */
export function useAuditLogs(params: AuditLogParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditApi.getAuditLogs(params),
    enabled: options.enabled ?? true,
    // เปลี่ยนหน้า/ตัวกรองแล้วยังเห็นของเดิมจนชุดใหม่มา ภาพไม่กระพริบ
    placeholderData: keepPreviousData,
  });
}

export function useAuditSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: auditKeys.summary(from, to),
    queryFn: () => auditApi.getAuditSummary({ from, to }),
  });
}
