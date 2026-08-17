import { Outlet } from "react-router-dom";

/**
 * โครงหน้า Login / Register — การ์ดกลางจอ ไม่มี Navbar และ Footer
 * ตัว wrapper เป็น `relative overflow-hidden` อยู่แล้ว หน้าที่อยู่ข้างในจึงวาง
 * ภาพพื้นหลังแบบ `absolute inset-0` ได้เลยโดยไม่ต้องห่อ div เพิ่ม
 */
export function AuthLayout() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden p-6 md:p-12">
      <Outlet />
    </main>
  );
}
