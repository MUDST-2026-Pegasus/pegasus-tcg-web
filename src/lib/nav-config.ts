import {
  BadgeCheck,
  ClipboardCheck,
  LayoutDashboard,
  Library,
  LogOut,
  Package,
  Percent,
  Receipt,
  ScrollText,
  ShoppingBag,
  Store,
  Tags,
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
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Sidebar ของ /admin — ลำดับและชื่อเมนูอ้างจาก Figma node 432:4152 เป็นต้นไป
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
      { label: "จัดการแคตตาล็อก", to: "/admin/catalog", icon: Library },
      { label: "คุณสมบัติการ์ด", to: "/admin/card-attributes", icon: Tags },
    ],
  },
  {
    label: "ความน่าเชื่อถือ",
    items: [
      { label: "อนุมัติผู้ขาย", to: "/admin/sellers", icon: BadgeCheck },
      {
        label: "ตรวจสอบประกาศขาย",
        to: "/admin/listings",
        icon: ClipboardCheck,
      },
      { label: "จัดการผู้ใช้", to: "/admin/users", icon: Users },
    ],
  },
  {
    label: "การขาย",
    items: [
      { label: "ภาพรวมคำสั่งซื้อ", to: "/admin/orders", icon: ShoppingBag },
      { label: "ค่าคอมมิชชั่น", to: "/admin/commission", icon: Percent },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { label: "บันทึกกิจกรรม", to: "/admin/activity-log", icon: ScrollText },
    ],
  },
];

/** Sidebar ของ /seller — อ้างจาก Figma node 432:6773 เป็นต้นไป */
export const sellerNav: NavGroup[] = [
  {
    label: "ร้านของฉัน",
    items: [
      { label: "แดชบอร์ด", to: "/seller", icon: LayoutDashboard, end: true },
      { label: "จัดการร้านค้า", to: "/seller/shop", icon: Store },
      { label: "จัดการสินค้า", to: "/seller/products", icon: Package },
    ],
  },
  {
    label: "คำสั่งซื้อและเงิน",
    items: [
      { label: "จัดการคำสั่งซื้อ", to: "/seller/orders", icon: Receipt },
      { label: "ถอนเงิน", to: "/seller/payout", icon: Wallet },
    ],
  },
  {
    label: "บัญชี",
    items: [{ label: "ออกจากระบบ", to: "/seller/logout", icon: LogOut }],
  },
];
