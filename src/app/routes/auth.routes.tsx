import type { RouteObject } from "react-router-dom";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";

/** เข้าสู่ระบบ / สมัครสมาชิก — ใช้ AuthLayout (การ์ดกลางจอ ไม่มี Navbar) */
export const authRoutes: RouteObject = {
  element: (
    <RedirectIfAuthenticated>
      <AuthLayout />
    </RedirectIfAuthenticated>
  ),
  children: [
    { path: "login", element: <LoginPage /> },
    { path: "register", element: <RegisterPage /> },
  ],
};
