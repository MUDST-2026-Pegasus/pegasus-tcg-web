import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

/**
 * ครอบ `<Outlet />` ของ layout ให้หน้าใหม่ค่อย ๆ จางเข้ามาทุกครั้งที่เปลี่ยน path
 *
 * key ตาม pathname ทำให้หน้าถูก mount ใหม่ — เปลี่ยน `?query` ในหน้าเดิมไม่กระพริบ
 * ใช้ opacity อย่างเดียว (`animate-page-in` ใน globals.css) ลูกที่เป็น fixed / absolute
 * จึงไม่เลื่อนระหว่าง animation
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pathname } = useLocation();

  return (
    <div
      key={pathname}
      className={cn(
        "animate-page-in motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
