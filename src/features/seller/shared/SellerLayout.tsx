import { Outlet, useLocation } from "react-router-dom";

import { PageTransition } from "@/components/common/PageTransition";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { SellerSidebar } from "./SellerSidebar";
import { SellerStatusBanner } from "./SellerStatusBanner";
import { useSellerProfile } from "./seller.queries";

/**
 * Layout ของโซนผู้ขายทั้งหมด — เหมือน DashboardLayout ของ admin
 * แต่ใช้ SellerSidebar แยกต่างหาก จะปรับหน้าตา sidebar ฝั่งนี้ได้อิสระ
 *
 * โหลดโปรไฟล์ผู้ขายเองตอน render (ไม่ใช่ตอนประกอบ route)
 * สถานะร้านมาจาก `/sellers/me`
 */
export function SellerLayout() {
  const profile = useSellerProfile();
  const pathname = useLocation().pathname;
  const isShop = pathname === "/seller/shop";
  const isPayout = pathname === "/seller/payout" || pathname === "/seller/verification";

  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ "--navbar-h": "75px" } as React.CSSProperties}
    >
      <Navbar />

      <SidebarProvider className="min-h-0 flex-1 items-stretch">
        <SellerSidebar />

        <SidebarInset className="min-w-0">
          <header className="flex h-12 shrink-0 items-center border-b border-border px-4 md:hidden">
            <SidebarTrigger />
          </header>

          <div className={isShop || isPayout ? "min-w-0 flex-1 bg-[#f6f8f9] px-4 pt-7 pb-10 md:px-8" : "flex-1 bg-muted px-8 pt-7 pb-10"}>
            {!isShop && <SellerStatusBanner profile={profile} />}
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Footer />
    </div>
  );
}
