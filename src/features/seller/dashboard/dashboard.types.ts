import type { LucideIcon } from "lucide-react";

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

/** ย้ายขึ้น shared/seller.types.ts เมื่อหน้า "จัดการคำสั่งซื้อ" ต้องใช้ซ้ำ */
export type OrderStatus =
  | "awaiting_pack"
  | "shipped"
  | "awaiting_payment"
  | "completed";

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
