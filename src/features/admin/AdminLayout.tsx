import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminNav } from "@/lib/nav-config";

/** DashboardLayout ของ /admin — เมนูมาจาก useAdminNav() เพื่อให้เปลี่ยนตามภาษา [TCG-550] */
export function AdminLayout() {
  return <DashboardLayout role="ADMIN" groups={useAdminNav()} />;
}
