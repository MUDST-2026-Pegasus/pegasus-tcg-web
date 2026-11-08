import { Outlet } from "react-router-dom";

import { PageTransition } from "@/components/common/PageTransition";
import { useAuth } from "@/features/auth/auth.queries";

import { toSidebarUser } from "../account.format";
import { AccountSidebar } from "./AccountSidebar";

/**
 * กรอบของทุกหน้า /account/* — sidebar อยู่ที่นี่ที่เดียว
 * เปลี่ยนแท็บแล้ว sidebar ไม่ถูก mount ใหม่ เปลี่ยนแค่เนื้อหาฝั่งขวา (Outlet)
 */
export function AccountLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-[720px] bg-muted/60 px-4 py-10 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar user={toSidebarUser(user)} />
        <PageTransition className="min-w-0">
          <Outlet />
        </PageTransition>
      </div>
    </div>
  );
}
