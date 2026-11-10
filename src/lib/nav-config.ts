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

import { useTranslate } from "@/lib/i18n";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** true = highlight only on an exact URL match (index routes) */
  end?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Sidebar ของ /admin — ลำดับ ชื่อเมนู และไอคอนอ้างจาก Figma component Sidebar_Admin (node 1371:6991)
 * แก้ที่นี่ที่เดียว ทั้ง AppSidebar และหน้า admin ทุกหน้าจะเปลี่ยนตาม
 * เป็น hook เพราะชื่อเมนูต้องเปลี่ยนตามภาษา (layout อยู่นอก Suspense ของหน้า จึงใช้ namespace common) [TCG-550]
 */
export function useAdminNav(): NavGroup[] {
  const { t } = useTranslate();
  return [
    {
      label: t("sidebar.admin.groups.overview", "ภาพรวม"),
      items: [
        { label: t("sidebar.admin.items.platformOverview", "ภาพรวมแพลตฟอร์ม"), to: "/admin", icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: t("sidebar.admin.groups.catalog", "แคตตาล็อก"),
      items: [
        { label: t("sidebar.admin.items.catalog", "จัดการแคตตาล็อก"), to: "/admin/catalog", icon: LayoutGrid },
        { label: t("sidebar.admin.items.cardAttributes", "เกมและคุณสมบัติการ์ด"), to: "/admin/card-attributes", icon: Settings2 },
      ],
    },
    {
      label: t("sidebar.admin.groups.trust", "ความน่าเชื่อถือ"),
      items: [
        { label: t("sidebar.admin.items.sellerApproval", "อนุมัติผู้ขาย"), to: "/admin/sellers", icon: BadgeCheck },
      ],
    },
    {
      label: t("sidebar.admin.groups.operations", "การดำเนินงาน"),
      items: [
        { label: t("sidebar.admin.items.users", "จัดการผู้ใช้"), to: "/admin/users", icon: Users },
        { label: t("sidebar.admin.items.orders", "ภาพรวมคำสั่งซื้อ"), to: "/admin/orders", icon: ShoppingCart },
        { label: t("sidebar.admin.items.auctions", "การประมูล"), to: "/admin/auctions", icon: Gavel },
        { label: t("sidebar.admin.items.commission", "ค่าคอมมิชชั่น"), to: "/admin/commission", icon: Wallet },
        { label: t("sidebar.admin.items.weeklyReport", "รายงานสต็อก/กำไรรายสัปดาห์"), to: "/admin/reports/weekly-stock-profit", icon: ChartColumn },
        { label: t("sidebar.admin.items.promotions", "โปรโมชั่น & โค้ดส่วนลด"), to: "/admin/promotions", icon: TicketPercent },
        { label: t("sidebar.admin.items.reviews", "จัดการรีวิว"), to: "/admin/reviews", icon: Star },
      ],
    },
    {
      label: t("sidebar.admin.groups.finance", "จัดการเงิน"),
      items: [
        { label: t("sidebar.admin.items.payments", "ตรวจสอบสลิปชำระเงิน"), to: "/admin/payments", icon: FileText },
        { label: t("sidebar.admin.items.refunds", "คืนเงิน"), to: "/admin/refunds", icon: Undo2 },
        { label: t("sidebar.admin.items.payouts", "ถอนเงินผู้ขาย"), to: "/admin/payouts", icon: ArrowUpRight },
      ],
    },
    {
      label: t("sidebar.admin.groups.system", "ระบบ"),
      items: [
        { label: t("sidebar.admin.items.activityLog", "บันทึกกิจกรรม"), to: "/admin/activity-log", icon: Clock2 },
      ],
    },
  ];
}

/** Sidebar ของ /seller — อ้างจาก Figma node 432:6773 เป็นต้นไป */
export function useSellerNav(): NavGroup[] {
  const { t } = useTranslate();
  return [
    {
      label: t("sidebar.seller.groups.overview", "ภาพรวม"),
      items: [
        { label: t("sidebar.seller.items.dashboard", "แดชบอร์ด"), to: "/seller", icon: LayoutDashboard, end: true },
      ],
    },
    {
      label: t("sidebar.seller.groups.shop", "ร้านค้า"),
      items: [
        { label: t("sidebar.seller.items.shop", "จัดการร้านค้า"), to: "/seller/shop", icon: Store },
        { label: t("sidebar.seller.items.products", "จัดการสินค้า"), to: "/seller/products", icon: Package },
        { label: t("sidebar.seller.items.orders", "จัดการคำสั่งซื้อ"), to: "/seller/orders", icon: Receipt },
        { label: t("sidebar.seller.items.promotions", "โค้ดส่วนลดร้าน"), to: "/seller/promotions", icon: TicketPercent },
        { label: t("sidebar.seller.items.returns", "คำขอคืนสินค้า"), to: "/seller/returns", icon: Undo2 },
        { label: t("sidebar.seller.items.reviews", "รีวิวร้านค้า"), to: "/seller/reviews", icon: Star },
        { label: t("sidebar.seller.items.auctions", "การประมูล"), to: "/seller/auctions", icon: Gavel },
      ],
    },
    {
      label: t("sidebar.seller.groups.finance", "การเงิน"),
      items: [
        { label: t("sidebar.seller.items.payout", "ถอนเงิน"), to: "/seller/payout", icon: Wallet },
      ],
    },
  ];
}
