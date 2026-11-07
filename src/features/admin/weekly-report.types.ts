/**
 * `/admin/reports/weekly-stock-profit` — ลอกจาก `WeeklyStockProfitViews.java`
 * ช่วงเวลาเป็นสัปดาห์จันทร์-อาทิตย์ตามเวลาไทยเสมอ ยอดเงินนับเฉพาะคำสั่งซื้อที่สำเร็จแล้ว
 */

export type WeeklyReportMeta = {
  startDate: string;
  endDate: string;
  timezone: string;
  gameCategory: string | null;
  productType: string | null;
  commissionRatePercent: number;
};

export type WeeklyReportSummary = {
  gmv: number;
  weeklyGmv: number;
  commission: number;
  commissionCollected: number;
  netProfit: number;
  initialStock: number;
  soldCount: number;
  remainingStock: number;
  stockDepleted: number;
  /** % ยอดขายเทียบสัปดาห์ก่อน — สัปดาห์ก่อนไม่มียอด backend ส่ง 0 */
  wowChangePercent: number;
};

export type WeeklyDailySales = {
  date: string;
  singles: number;
  sealed: number;
  /** สินค้าที่ไม่ใช่การ์ดเดี่ยวหรือกล่อง/ซอง — สามช่องรวมกันเท่ายอดขายของวันนั้น */
  other: number;
};

export type WeeklyDailyKpi = {
  date: string;
  gmv: number;
  netProfit: number;
  commission: number;
  /** สต็อกสิ้นวัน — `null` = วันที่ยังมาไม่ถึง */
  remainingStock: number | null;
};

export type WeeklyGameDistribution = {
  game: string;
  gameSlug: string;
  gmv: number;
  netProfit: number;
  remainingStock: number;
  percentage: number;
};

export type WeeklyStockStatus = "NORMAL" | "LOW_STOCK" | "FAST_MOVING";

export type WeeklyProductType = "SINGLE_CARD" | "SEALED" | "OTHER";

/** แถวตารางแยกตามเกมและประเภทสินค้า — `breakdownByGameAndType` */
export type WeeklyBreakdownRow = {
  game: string;
  gameSlug: string;
  productType: WeeklyProductType;
  productTypeLabel: string;
  initialStock: number;
  soldCount: number;
  remainingStock: number;
  gmv: number;
  commission: number;
  netProfit: number;
  status: WeeklyStockStatus;
  statusLabel: string;
};

export type WeeklyBreakdownTotals = {
  initialStock: number;
  soldCount: number;
  remainingStock: number;
  singleCards: number;
  sealedBoxes: number;
  otherItems: number;
  gmv: number;
  weeklyGmv: number;
  commission: number;
  commissionCollected: number;
  netProfit: number;
};

export type WeeklyReport = {
  startDate: string;
  endDate: string;
  hasData: boolean;
  meta: WeeklyReportMeta;
  summary: WeeklyReportSummary;
  chartData: WeeklyDailySales[];
  kpiHistory: WeeklyDailyKpi[];
  gameDistribution: WeeklyGameDistribution[];
  breakdownByGameAndType: WeeklyBreakdownRow[];
  totals: WeeklyBreakdownTotals;
};

export type WeeklyReportFilters = {
  /** วันจันทร์ของสัปดาห์ "YYYY-MM-DD" */
  weekStart: string;
  /** slug ของเกม — `null` = ทุกเกม */
  game: string | null;
};

export type WeeklyReportExportFormat = "csv" | "xlsx";

/** ชุดข้อมูลในไฟล์ export: สรุป KPI และแถวรายวัน / ตารางแยกเกมและประเภทสินค้า */
export type WeeklyReportExportDataset = "kpi" | "breakdown";

/** `StockThresholds` — อัตราค่าคอมอ่านอย่างเดียว เจ้าของคือหน้าตั้งค่าคอมมิชชั่น */
export type WeeklyStockThresholds = {
  lowStockThreshold: number;
  fastMovingPercent: number;
  standardCommissionRatePercent: number;
};

/** `StockThresholdsUpdate` */
export type WeeklyStockThresholdsPayload = Pick<
  WeeklyStockThresholds,
  "lowStockThreshold" | "fastMovingPercent"
>;
