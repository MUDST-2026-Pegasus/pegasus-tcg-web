import { Outlet } from "react-router-dom";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SellerSidebar } from "@/features/seller/components/SellerSidebar";
import type { SellerProfile } from "@/features/seller/seller.types";

type SellerLayoutProps = {
  profile: SellerProfile;
};

/**
 * Layout ของโซนผู้ขายทั้งหมด — เหมือน DashboardLayout ของ admin
 * แต่ใช้ SellerSidebar แยกต่างหาก จะปรับหน้าตา sidebar ฝั่งนี้ได้อิสระ
 */
export function SellerLayout({ profile }: SellerLayoutProps) {
  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ "--navbar-h": "75px" } as React.CSSProperties}
    >
      <Navbar />

      <SidebarProvider className="min-h-0 flex-1 items-stretch">
        <SellerSidebar profile={profile} />

        <SidebarInset className="min-w-0">
          <header className="flex h-12 shrink-0 items-center border-b border-border px-4 md:hidden">
            <SidebarTrigger />
          </header>

          <div className="flex-1 bg-muted px-8 pt-7 pb-10">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Footer />
    </div>
  );
}
