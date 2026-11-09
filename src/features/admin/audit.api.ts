import { api, type PageResponse } from "@/lib/api";

import type { AuditLogEntry, AuditLogParams, AuditSummary } from "./audit.types";

/**
 * `/admin/audit-logs` (`AdminAuditLogController.java`) — อ่านอย่างเดียว
 * backend ไม่มี endpoint แก้/ลบ log ทุกตัวบังคับ role ADMIN
 */

/** ใหม่สุดก่อน · `action`/`targetType` ส่งซ้ำได้หลายค่า */
export function getAuditLogs(params: AuditLogParams): Promise<PageResponse<AuditLogEntry>> {
  return api.get<PageResponse<AuditLogEntry>>("/admin/audit-logs", {
    query: {
      actorUserId: params.actorUserId,
      action: params.action?.length ? params.action : undefined,
      targetType: params.targetType?.length ? params.targetType : undefined,
      targetId: params.targetId,
      from: params.from,
      to: params.to,
      q: params.q?.trim() || undefined,
      page: params.page,
      size: params.size,
    },
  });
}

/** ตัวเลขในช่วง `[from, to)` สำหรับการ์ดสรุปข้างหน้า */
export function getAuditSummary(range: { from?: string; to?: string }): Promise<AuditSummary> {
  return api.get<AuditSummary>("/admin/audit-logs/summary", {
    query: { from: range.from, to: range.to },
  });
}
