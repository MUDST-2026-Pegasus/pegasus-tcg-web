import {
  BadgeCheck,
  Clock2,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Receipt,
  Settings2,
  Shield,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** true = highlight only on an exact URL match (index routes) */
  end?: boolean;
  /** "danger" = ย้อมสีแดงตลอด (ใช้กับ "ออกจากระบบ") */
  tone?: "default" | "danger";
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Sidebar ของ /admin — ลำดับ ชื่อเมนู และไอคอนอ้างจาก Figma component Sidebar_Admin (node 1371:6991)
 * แก้ที่นี่ที่เดียว ทั้ง AppSidebar และหน้า admin ทุกหน้าจะเปลี่ยนตาม
 */
export const adminNav: NavGroup[] = [
  {
    label: "ภาพรวม",
    items: [
      {
        label: "ภาพรวมแพลตฟอร์ม",
        to: "/admin",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: "แคตตาล็อก",
    items: [
      { label: "จัดการแคตตาล็อก", to: "/admin/catalog", icon: LayoutGrid },
      { label: "คุณสมบัติการ์ด", to: "/admin/card-attributes", icon: Settings2 },
    ],
  },
  {
    label: "ความน่าเชื่อถือ",
    items: [
      { label: "อนุมัติผู้ขาย", to: "/admin/sellers", icon: BadgeCheck },
      { label: "ตรวจสอบประกาศขาย", to: "/admin/listings", icon: Shield },
    ],
  },
  {
    label: "การดำเนินงาน",
    items: [
      { label: "จัดการผู้ใช้", to: "/admin/users", icon: Users },
      { label: "ภาพรวมคำสั่งซื้อ", to: "/admin/orders", icon: ShoppingCart },
      { label: "ค่าคอมมิชชั่น", to: "/admin/commission", icon: Wallet },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { label: "บันทึกกิจกรรม", to: "/admin/activity-log", icon: Clock2 },
    ],
  },
];

/** Sidebar ของ /seller — อ้างจาก Figma node 432:6773 เป็นต้นไป */
export const sellerNav: NavGroup[] = [
  {
    label: "ภาพรวม",
    items: [
      { label: "แดชบอร์ด", to: "/seller", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "ร้านค้า",
    items: [
      { label: "จัดการร้านค้า", to: "/seller/shop", icon: Store },
      { label: "จัดการสินค้า", to: "/seller/products", icon: Package },
      { label: "จัดการคำสั่งซื้อ", to: "/seller/orders", icon: Receipt },
    ],
  },
  {
    label: "การเงิน",
    items: [{ label: "ถอนเงิน", to: "/seller/payout", icon: Wallet }],
  },
  {
    label: "บัญชี",
    items: [
      {
        label: "ออกจากระบบ",
        to: "/seller/logout",
        icon: LogOut,
        tone: "danger",
      },
    ],
  },
];
