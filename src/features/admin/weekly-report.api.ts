import { api, type FileDownload } from "@/lib/api";

import { weekEnd } from "./weekly-report.format";
import type {
  WeeklyReport,
  WeeklyReportExportDataset,
  WeeklyReportExportFormat,
  WeeklyReportFilters,
  WeeklyStockThresholds,
  WeeklyStockThresholdsPayload,
} from "./weekly-report.types";

/** `AdminWeeklyStockProfitController.java` — บังคับ role ADMIN ที่ backend */
const BASE = "/admin/reports/weekly-stock-profit";

function filterQuery({ weekStart, game }: WeeklyReportFilters) {
  return {
    startDate: weekStart,
    endDate: weekEnd(weekStart),
    gameCategory: game ?? undefined,
  };
}

export function getWeeklyReport(filters: WeeklyReportFilters): Promise<WeeklyReport> {
  return api.get<WeeklyReport>(BASE, { query: filterQuery(filters) });
}

export function exportWeeklyReport(
  filters: WeeklyReportFilters,
  format: WeeklyReportExportFormat,
  datasets: WeeklyReportExportDataset[],
): Promise<FileDownload> {
  return api.download(`${BASE}/export`, {
    query: { ...filterQuery(filters), format, datasets: datasets.join(",") },
  });
}

export function getWeeklyThresholds(): Promise<WeeklyStockThresholds> {
  return api.get<WeeklyStockThresholds>(`${BASE}/thresholds`);
}

export function updateWeeklyThresholds(
  payload: WeeklyStockThresholdsPayload,
): Promise<WeeklyStockThresholds> {
  return api.put<WeeklyStockThresholds>(`${BASE}/thresholds`, payload);
}
