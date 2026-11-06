import { api, type FileDownload } from "@/lib/api";

import { weekEnd } from "./weekly-report.format";
import type {
  WeeklyReport,
  WeeklyReportExportFormat,
  WeeklyReportFilters,
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
): Promise<FileDownload> {
  return api.download(`${BASE}/export`, {
    query: { ...filterQuery(filters), format },
  });
}
