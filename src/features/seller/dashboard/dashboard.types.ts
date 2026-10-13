import type { LucideIcon } from "lucide-react";

import type {
  OrderStatus,
  SellerOrderStatus,
} from "@/features/seller/shared/seller.types";

export type SalesChartBar = {
  /** ความสูงของแท่งกราฟ หน่วย px */
  height: number;
  /** true = เดือน/ช่วงล่าสุด เน้นสีขาวเต็ม ที่เหลือจางกว่า */
  highlighted: boolean;
};

export type SalesSummary = {
  label: string;
  amount: string;
  delta: string;
  description: string;
  bars: SalesChartBar[];
  rangeStart: string;
  rangeEnd: string;
};

export type TodoAccent = "red" | "amber" | "primary" | "gray";

export type TodoItem = {
  id: string;
  icon: LucideIcon;
  accent: TodoAccent;
  title: string;
  description: string;
};

export type TodoList = {
  title: string;
  description: string;
  count: number;
  items: TodoItem[];
};

export type StatAccent = "primary" | "violet" | "amber" | "green";

export type StatCardData = {
  id: string;
  icon: LucideIcon;
  accent: StatAccent;
  label: string;
  value: string;
  footnote: string;
};

export type OrderRow = {
  id: string;
  buyer: string;
  item: string;
  price: string;
  status: OrderStatus;
  statusLabel: string;
};

export type RecentOrders = {
  title: string;
  actionLabel: string;
  items: OrderRow[];
};

export type StockSeverity = "critical" | "warning";

export type LowStockItem = {
  id: string;
  name: string;
  remainingLabel: string;
  /** สัดส่วนที่เหลือ 0-100 ใช้วาดความยาวแถบ */
  percent: number;
  severity: StockSeverity;
};

export type LowStock = {
  title: string;
  /** จำนวนสินค้าใกล้หมดทั้งหมด อาจมากกว่าจำนวนใน items ถ้าตัดแสดงบางส่วน */
  count: number;
  items: LowStockItem[];
  actionLabel: string;
};

export type DashboardData = {
  greeting: string;
  subtitle: string;
  actions: {
    viewShopLabel: string;
    createListingLabel: string;
  };
  sales: SalesSummary;
  todo: TodoList;
  stats: StatCardData[];
  recentOrders: RecentOrders;
  lowStock: LowStock;
};

// ---------- ข้อมูลจาก `GET /sellers/me/dashboard` ----------
// ลอกมาจาก `dto/SellerDashboardViews.java` ถ้าฝั่งนั้นแก้ ส่วนนี้ต้องแก้ตาม
// ทุกค่าเป็นค่าดิบ (จำนวนเงิน / timestamp ISO / status) — ข้อความไปจัดใน dashboard.format.ts

/** ช่วงเวลาที่ตัวเลขเดือนนี้นับ — half-open `[from, to)` ตามเวลาไทย */
export type DashboardPeriod = {
  /** "YYYY-MM" */
  month: string;
  from: string;
  to: string;
};

export type MonthlySales = {
  /** "YYYY-MM" */
  month: string;
  amount: number;
};

/** ยอดขาย = `items_subtotal` (ไม่รวมค่าส่ง) ของออเดอร์ที่จ่ายในเดือน และยังไม่ถูกยกเลิก/คืน */
export type DashboardSales = {
  value: number;
  previous: number;
  orderCount: number;
  previousOrderCount: number;
  /** 12 เดือน เก่าสุดก่อน เดือนสุดท้ายคือเดือนที่เลือก */
  monthly: MonthlySales[];
};

/** ผลประกอบการของออเดอร์ชุดเดียวกับยอดขาย — `net` = revenue − commission − cost */
export type DashboardMonthSummary = {
  /** `grand_total` รวมค่าส่งที่ผู้ซื้อจ่าย */
  revenue: number;
  cost: number;
  commission: number;
  net: number;
};

export type LowStockListing = {
  listingId: number;
  productName: string;
  lotLabel: string | null;
  conditionCode: string;
  quantityAvailable: number;
  quantityTotal: number;
};

export type DashboardListings = {
  active: number;
  publishedThisMonth: number;
  /** ใกล้หมด = ACTIVE และเหลือพร้อมขาย 1 ถึงค่านี้ */
  lowStockThreshold: number;
  lowStockCount: number;
  /** ที่เหลือน้อยสุดก่อน ไม่เกิน 5 รายการ */
  lowStock: LowStockListing[];
};

export type DashboardReviews = {
  /** `null` = ยังไม่มีรีวิว */
  average: number | null;
  count: number;
  thisMonth: number;
  unreplied: number;
};

export type DashboardWallet = {
  withdrawable: number;
  /** เงินที่ยังพักใน escrow รอผู้ซื้อยืนยันรับ */
  pending: number;
};

export type RecentOrder = {
  sellerOrderId: number;
  sellerOrderNumber: string;
  buyerUsername: string;
  buyerDisplayName: string | null;
  /** ชื่อสินค้าบรรทัดแรกตามที่ snapshot ไว้ตอนสั่ง */
  firstItemName: string | null;
  itemCount: number;
  grandTotal: number;
  status: SellerOrderStatus;
  createdAt: string;
};

export type SellerDashboard = {
  period: DashboardPeriod;
  sales: DashboardSales;
  month: DashboardMonthSummary;
  /** จำนวนออเดอร์ทั้งหมดของร้านแยกตามสถานะ — สถานะที่ไม่มีเลยไม่อยู่ใน object */
  orders: Partial<Record<SellerOrderStatus, number>>;
  listings: DashboardListings;
  reviews: DashboardReviews;
  wallet: DashboardWallet;
  recentOrders: RecentOrder[];
};
