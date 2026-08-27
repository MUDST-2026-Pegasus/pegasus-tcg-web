import { Outlet } from "react-router-dom";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
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

export function DashboardLayout({ role, groups }: DashboardLayoutProps) {
  return (
    <div
      className="flex min-h-svh flex-col"
      style={{ "--navbar-h": "75px" } as React.CSSProperties}
    >
      <Navbar />

      <SidebarProvider className="min-h-0 flex-1 items-stretch">
        <AppSidebar role={role} groups={groups} />

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
