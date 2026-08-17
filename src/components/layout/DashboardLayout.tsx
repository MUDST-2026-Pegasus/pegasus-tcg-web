import { Outlet } from "react-router-dom";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { Footer } from "@/components/layout/Footer";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { NavGroup } from "@/lib/nav-config";

type DashboardLayoutProps = {
  role: string;
  groups: NavGroup[];
};

/**
 * โครงหน้าหลังบ้าน — Sidebar + TopBar + เนื้อหา + Footer
 * Admin (9 หน้า) และ Seller (6 หน้า) ใช้โครงเดียวกัน ต่างแค่ `groups`
 * ที่ส่งเข้ามาจาก #lib/nav-config
 */
export function DashboardLayout({ role, groups }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} groups={groups} />
      <SidebarInset className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-30 flex h-[75px] shrink-0 items-center gap-3 border-b border-border bg-background/90 px-6 backdrop-blur-[6px]">
          <SidebarTrigger />
        </header>
        {/* SidebarInset เป็น <main> อยู่แล้ว ตรงนี้จึงใช้ div ไม่ให้ landmark ซ้อนกัน */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
