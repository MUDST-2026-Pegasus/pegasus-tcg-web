import { useMutation, useQuery } from "@tanstack/react-query";

import * as weeklyReportApi from "./weekly-report.api";
import type {
  WeeklyReportExportFormat,
  WeeklyReportFilters,
} from "./weekly-report.types";

export const weeklyReportKeys = {
  all: ["admin-weekly-report"] as const,
  report: ({ weekStart, game }: WeeklyReportFilters) =>
    [...weeklyReportKeys.all, weekStart, game ?? "all"] as const,
};

/** รายงานรายสัปดาห์ไม่ต้อง real-time — เก็บไว้ 5 นาทีเท่าหน้าภาพรวม */
const REPORT_STALE_MS = 5 * 60_000;

export function useWeeklyReport(filters: WeeklyReportFilters) {
  return useQuery({
    queryKey: weeklyReportKeys.report(filters),
    queryFn: () => weeklyReportApi.getWeeklyReport(filters),
    staleTime: REPORT_STALE_MS,
  });
}

export function useExportWeeklyReport() {
  return useMutation({
    mutationFn: ({
      filters,
      format,
    }: {
      filters: WeeklyReportFilters;
      format: WeeklyReportExportFormat;
    }) => weeklyReportApi.exportWeeklyReport(filters, format),
  });
}
