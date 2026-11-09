/**
 * ลอกจาก `dto/audit/AuditLogResponse.java`, `dto/audit/AuditLogSummaryResponse.java`
 * และ `model/audit/AuditAction.java` / `AuditTargetType.java` ของ pegasus-tcg-api
 * (`/admin/audit-logs` มาจาก TCG-431, `/summary` จาก TCG-432) ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 *
 * `action` กับ `targetType` พิมพ์เป็น string เปล่า ไม่ใช่ union ปิด — backend เพิ่ม action ใหม่
 * ได้ตลอด หน้าต้องแสดงได้ด้วยป้าย fallback แทนที่จะพัง
 */

export type AuditActor = {
  userId: number;
  username: string;
  displayName: string;
};

export type AuditLogEntry = {
  id: number;
  occurredAt: string;
  /** null = ระบบ (งานตามเวลา) หรือบัญชีถูกลบไปแล้ว */
  actor: AuditActor | null;
  action: string;
  targetType: string;
  targetId: string;
  /** ข้อความภาษาอังกฤษจาก backend — ใช้ค้นหาและเป็น fallback เท่านั้น */
  summary: string;
  /** id อ้างอิงและค่าเดิม/ใหม่ ไม่มี PII */
  metadata: Record<string, unknown>;
  ipAddress: string | null;
};

export type AuditLogParams = {
  actorUserId?: number;
  action?: string[];
  targetType?: string[];
  targetId?: string;
  /** ISO-8601 รวมขอบนี้ */
  from?: string;
  /** ISO-8601 ไม่รวมขอบนี้ */
  to?: string;
  q?: string;
  page: number;
  size: number;
};

export type AuditTopActor = AuditActor & { count: number };

export type AuditSummary = {
  total: number;
  byAdmins: number;
  bySystem: number;
  byAction: Record<string, number>;
  topActors: AuditTopActor[];
};
