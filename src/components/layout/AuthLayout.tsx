import { Link, Outlet } from "react-router-dom";

import { PageTransition } from "@/components/common/PageTransition";
import { Button } from "@/components/ui/button";

/**
 * โครงหน้า Login / Register — การ์ดกลางจอ ไม่มี Navbar และ Footer
 * ตัว wrapper เป็น `relative overflow-hidden` อยู่แล้ว หน้าที่อยู่ข้างในจึงวาง
 * ภาพพื้นหลังแบบ `absolute inset-0` ได้เลยโดยไม่ต้องห่อ div เพิ่ม
 * (PageTransition ไม่ได้ตั้ง position / transform ภาพจึงยังยึดกับ main เหมือนเดิม)
 */
export function AuthLayout() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden p-6 md:p-12">
      <PageTransition className="flex w-full flex-col items-center justify-center gap-5">
        <div className="relative z-10 w-full max-w-2xl">
          <Button
            variant="outline"
            className="h-[38px] rounded-lg bg-background px-3"
            nativeButton={false}
            render={<Link to="/" />}
          >
            Back to home
          </Button>
        </div>
        <Outlet />
      </PageTransition>
    </main>
  );
}
