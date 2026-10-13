import { useQuery } from "@tanstack/react-query";

import * as dashboardApi from "./dashboard.api";

export const dashboardKeys = {
  all: ["seller-dashboard"] as const,
  month: (month: string | undefined) =>
    [...dashboardKeys.all, month ?? "current"] as const,
};

/**
 * ตัวเลขแดชบอร์ดไม่ต้อง real-time — เก็บไว้ 1 นาทีก่อนถือว่าเก่า
 * สั้นกว่าของแอดมินเพราะผู้ขายเพิ่งแพ็คของเสร็จแล้วกลับมาดูหน้านี้บ่อย
 * ส่วนการเปลี่ยนสถานะออเดอร์ invalidate `dashboardKeys.all` เองอยู่แล้ว
 */
const DASHBOARD_STALE_MS = 60_000;

export function useSellerDashboard(month?: string) {
  return useQuery({
    queryKey: dashboardKeys.month(month),
    queryFn: () => dashboardApi.getSellerDashboard(month),
    staleTime: DASHBOARD_STALE_MS,
  });
}
