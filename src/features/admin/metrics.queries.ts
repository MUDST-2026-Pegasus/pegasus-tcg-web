import { useQuery } from "@tanstack/react-query";

import * as metricsApi from "./metrics.api";

export const metricsKeys = {
  all: ["admin-metrics"] as const,
  overview: (month: string | undefined) =>
    [...metricsKeys.all, "overview", month ?? "current"] as const,
};

/** ตัวเลข dashboard ไม่ต้อง real-time — เก็บไว้ 5 นาทีก่อนถือว่าเก่า */
const OVERVIEW_STALE_MS = 5 * 60_000;

export function useOverviewMetrics(month?: string) {
  return useQuery({
    queryKey: metricsKeys.overview(month),
    queryFn: () => metricsApi.getOverview(month),
    staleTime: OVERVIEW_STALE_MS,
  });
}
