import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as weeklyReportApi from "./weekly-report.api";
import type {
  WeeklyReportExportDataset,
  WeeklyReportExportFormat,
  WeeklyReportFilters,
  WeeklyStockThresholdsPayload,
} from "./weekly-report.types";

export const weeklyReportKeys = {
  all: ["admin-weekly-report"] as const,
  report: ({ weekStart, game }: WeeklyReportFilters) =>
    [...weeklyReportKeys.all, weekStart, game ?? "all"] as const,
  thresholds: () => ["admin-weekly-report-thresholds"] as const,
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
      datasets,
    }: {
      filters: WeeklyReportFilters;
      format: WeeklyReportExportFormat;
      datasets: WeeklyReportExportDataset[];
    }) => weeklyReportApi.exportWeeklyReport(filters, format, datasets),
  });
}

export function useWeeklyThresholds(enabled: boolean) {
  return useQuery({
    queryKey: weeklyReportKeys.thresholds(),
    queryFn: weeklyReportApi.getWeeklyThresholds,
    enabled,
  });
}

/** สถานะสต็อกในรายงานคำนวณจากเกณฑ์นี้ บันทึกแล้วจึงต้องดึงรายงานใหม่ทุกสัปดาห์ */
export function useSaveWeeklyThresholds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WeeklyStockThresholdsPayload) =>
      weeklyReportApi.updateWeeklyThresholds(payload),
    onSuccess: (saved) => {
      queryClient.setQueryData(weeklyReportKeys.thresholds(), saved);
      void queryClient.invalidateQueries({ queryKey: weeklyReportKeys.all });
    },
  });
}
