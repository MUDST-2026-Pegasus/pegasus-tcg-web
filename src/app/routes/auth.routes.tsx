import type { RouteObject } from "react-router-dom";

import { lazyPage } from "@/app/lazy-page";
import { AuthPageSkeleton } from "@/components/common/PageSkeletons";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";

const LoginPage = lazyPage(() => import("@/features/auth/pages/LoginPage").then((m) => m.LoginPage), <AuthPageSkeleton />);
const RegisterPage = lazyPage(() => import("@/features/auth/pages/RegisterPage").then((m) => m.RegisterPage), <AuthPageSkeleton />);

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
