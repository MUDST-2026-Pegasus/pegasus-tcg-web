import {
  TicketPercent,
  ArrowUpRight,
  BadgeCheck,
  ChartColumn,
  Clock2,
  FileText,
  Gavel,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Receipt,
  Star,
  Undo2,
  Settings2,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  labelEn?: string;
  to: string;
  icon: LucideIcon;
  /** true = highlight only on an exact URL match (index routes) */
  end?: boolean;
};

export type NavGroup = {
  label: string;
  labelEn?: string;
  items: NavItem[];
};

/**
 * Sidebar ของ /admin — ลำดับ ชื่อเมนู และไอคอนอ้างจาก Figma component Sidebar_Admin (node 1371:6991)
 * แก้ที่นี่ที่เดียว ทั้ง AppSidebar และหน้า admin ทุกหน้าจะเปลี่ยนตาม
 */
export const adminNav: NavGroup[] = [
  {
    label: "ภาพรวม", labelEn: "Overview",
    items: [
      {
        label: "ภาพรวมแพลตฟอร์ม", labelEn: "Platform overview",
        to: "/admin",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: "แคตตาล็อก", labelEn: "Catalog",
    items: [
      { label: "จัดการแคตตาล็อก", labelEn: "Manage catalog", to: "/admin/catalog", icon: LayoutGrid },
      {
        label: "เกมและคุณสมบัติการ์ด", labelEn: "Games and card attributes",
        to: "/admin/card-attributes",
        icon: Settings2,
      },
    ],
  },
  {
    label: "ความน่าเชื่อถือ", labelEn: "Trust and safety",
    items: [
      { label: "อนุมัติผู้ขาย", labelEn: "Seller approvals", to: "/admin/sellers", icon: BadgeCheck },
    ],
  },
  {
    label: "การดำเนินงาน", labelEn: "Operations",
    items: [
      { label: "จัดการผู้ใช้", labelEn: "Manage users", to: "/admin/users", icon: Users },
      { label: "ภาพรวมคำสั่งซื้อ", labelEn: "Orders overview", to: "/admin/orders", icon: ShoppingCart },
      { label: "การประมูล", labelEn: "Auctions", to: "/admin/auctions", icon: Gavel },
      { label: "ค่าคอมมิชชั่น", labelEn: "Commission", to: "/admin/commission", icon: Wallet },
      { label: "รายงานสต็อก/กำไรรายสัปดาห์", labelEn: "Weekly stock and profit report", to: "/admin/reports/weekly-stock-profit", icon: ChartColumn },
      { label: "โปรโมชั่น & โค้ดส่วนลด", labelEn: "Promotions and coupons", to: "/admin/promotions", icon: TicketPercent },
      { label: "จัดการรีวิว", labelEn: "Manage reviews", to: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "จัดการเงิน", labelEn: "Money management",
    items: [
      { label: "ตรวจสอบสลิปชำระเงิน", labelEn: "Payment verification", to: "/admin/payments", icon: FileText },
      { label: "คืนเงิน", labelEn: "Refunds", to: "/admin/refunds", icon: Undo2 },
      { label: "ถอนเงินผู้ขาย", labelEn: "Seller payouts", to: "/admin/payouts", icon: ArrowUpRight },
    ],
  },
  {
    label: "ระบบ", labelEn: "System",
    items: [
      { label: "บันทึกกิจกรรม", labelEn: "Activity log", to: "/admin/activity-log", icon: Clock2 },
    ],
  },
];

/** Sidebar ของ /seller — อ้างจาก Figma node 432:6773 เป็นต้นไป */
export const sellerNav: NavGroup[] = [
  {
    label: "ภาพรวม", labelEn: "Overview",
    items: [
      { label: "แดชบอร์ด", labelEn: "Dashboard", to: "/seller", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "ร้านค้า", labelEn: "Shop",
    items: [
      { label: "จัดการร้านค้า", labelEn: "Manage shop", to: "/seller/shop", icon: Store },
      { label: "จัดการสินค้า", labelEn: "Manage products", to: "/seller/products", icon: Package },
      { label: "จัดการคำสั่งซื้อ", labelEn: "Manage orders", to: "/seller/orders", icon: Receipt },
      { label: "โค้ดส่วนลดร้าน", labelEn: "Shop coupons", to: "/seller/promotions", icon: TicketPercent },
      { label: "คำขอคืนสินค้า", labelEn: "Return requests", to: "/seller/returns", icon: Undo2 },
      { label: "รีวิวร้านค้า", labelEn: "Shop reviews", to: "/seller/reviews", icon: Star },
      { label: "การประมูล", labelEn: "Auctions", to: "/seller/auctions", icon: Gavel },
    ],
  },
  {
    label: "การเงิน", labelEn: "Finance",
    items: [{ label: "ถอนเงิน", labelEn: "Withdrawals", to: "/seller/payout", icon: Wallet }],
  },
];
