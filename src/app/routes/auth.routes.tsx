import type { RouteObject } from "react-router-dom";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { LoginPage, RegisterPage } from "@/features/auth";

/** เข้าสู่ระบบ / สมัครสมาชิก — ใช้ AuthLayout (การ์ดกลางจอ ไม่มี Navbar) */
export const authRoutes: RouteObject = {
  element: <AuthLayout />,
  children: [
    { path: "login", element: <LoginPage /> },
    { path: "register", element: <RegisterPage /> },
  ],
};
