import { Outlet } from "react-router-dom";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/auth.queries";

import { SellerSidebar } from "./SellerSidebar";
import { SellerStatusBanner } from "./SellerStatusBanner";
import { toSellerIdentity } from "./seller.format";
import { useSellerProfile } from "./seller.queries";

/**
 * Layout ของโซนผู้ขายทั้งหมด — เหมือน DashboardLayout ของ admin
 * แต่ใช้ SellerSidebar แยกต่างหาก จะปรับหน้าตา sidebar ฝั่งนี้ได้อิสระ
 *
 * โหลดโปรไฟล์ผู้ขายเองตอน render (ไม่ใช่ตอนประกอบ route) ชื่อ/รูปมาจาก `useAuth()`
 * ส่วนสถานะร้านมาจาก `/sellers/me`
 */
export function SellerLayout() {
  const { user } = useAuth();
  const profile = useSellerProfile();

  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ "--navbar-h": "75px" } as React.CSSProperties}
    >
      <Navbar />

      <SidebarProvider className="min-h-0 flex-1 items-stretch">
        <SellerSidebar
          seller={toSellerIdentity(user)}
          // null = ยังไม่มี seller profile ถือว่ายังไม่ได้สมัคร
          status={
            profile.data === null ? "NOT_APPLIED" : profile.data?.status
          }
          statusUnavailable={profile.isError}
        />

        <SidebarInset className="min-w-0">
          <header className="flex h-12 shrink-0 items-center border-b border-border px-4 md:hidden">
            <SidebarTrigger />
          </header>

          <div className="flex-1 bg-muted px-8 pt-7 pb-10">
            <SellerStatusBanner profile={profile} />
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Footer />
    </div>
  );
}
