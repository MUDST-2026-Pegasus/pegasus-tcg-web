import { api } from "@/lib/api";

import type { AdminOverview } from "./metrics.types";

/**
 * `/admin/metrics` — ตัวเลขหน้าภาพรวมแพลตฟอร์ม (`AdminMetricsController.java`)
 * บังคับ role ADMIN ที่ backend
 */

/** @param month "YYYY-MM" — ไม่ส่ง = เดือนปัจจุบันตามเวลาไทย */
export function getOverview(month?: string): Promise<AdminOverview> {
  return api.get<AdminOverview>("/admin/metrics/overview", {
    query: { month },
  });
}
