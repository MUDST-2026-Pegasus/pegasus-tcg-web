import type { LucideIcon } from "lucide-react";

/** โปรไฟล์ผู้ขายที่ล็อกอินอยู่ — ใช้ทั้งใน sidebar footer และหัวหน้าแดชบอร์ด */
export type SellerProfile = {
  username: string;
  initials: string;
  verifiedLabel: string;
};

/* ── หน้า "แดชบอร์ด" ────────────────────────────────────────────── */

export type SalesChartBar = {
  /** ความสูงของแท่งกราฟ หน่วย px */
  height: number;
  /** true = เดือน/ช่วงล่าสุด เน้นสีขาวเต็ม ที่เหลือจางกว่า */
  highlighted: boolean;
};

export type SellerSalesSummary = {
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

export type SellerTodoList = {
  title: string;
  description: string;
  count: number;
  items: TodoItem[];
};

export type StatAccent = "primary" | "violet" | "amber" | "green";

export type SellerStatCardData = {
  id: string;
  icon: LucideIcon;
  accent: StatAccent;
  label: string;
  value: string;
  footnote: string;
};

export type OrderStatus =
  | "awaiting_pack"
  | "shipped"
  | "awaiting_payment"
  | "completed";

export type SellerOrderRow = {
  id: string;
  buyer: string;
  item: string;
  price: string;
  status: OrderStatus;
  statusLabel: string;
};

export type SellerRecentOrders = {
  title: string;
  actionLabel: string;
  items: SellerOrderRow[];
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

export type SellerLowStock = {
  title: string;
  /** จำนวนสินค้าใกล้หมดทั้งหมด อาจมากกว่าจำนวนใน items ถ้าตัดแสดงบางส่วน */
  count: number;
  items: LowStockItem[];
  actionLabel: string;
};

export type SellerDashboardData = {
  greeting: string;
  subtitle: string;
  actions: {
    viewShopLabel: string;
    createListingLabel: string;
  };
  sales: SellerSalesSummary;
  todo: SellerTodoList;
  stats: SellerStatCardData[];
  recentOrders: SellerRecentOrders;
  lowStock: SellerLowStock;
};
