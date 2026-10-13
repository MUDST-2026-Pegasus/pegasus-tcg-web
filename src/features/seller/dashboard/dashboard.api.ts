import { api } from "@/lib/api";

import type { SellerDashboard } from "./dashboard.types";

/**
 * ตัวเลขแดชบอร์ดของร้านที่ login อยู่ (`SellerDashboardController.java`)
 * component ไม่เรียกตรง ๆ ให้ผ่าน `useSellerDashboard()` ใน `dashboard.queries.ts`
 *
 * @param month "YYYY-MM" — ไม่ส่ง = เดือนปัจจุบันตามเวลาไทย
 */
export function getSellerDashboard(month?: string): Promise<SellerDashboard> {
  return api.get<SellerDashboard>("/sellers/me/dashboard", {
    query: { month },
  });
}
