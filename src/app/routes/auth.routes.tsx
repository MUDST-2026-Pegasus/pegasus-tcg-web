import type { RouteObject } from "react-router-dom";

import { lazyPage } from "@/app/lazy-page";
import { msg } from "@/lib/i18n";
import {
  LoginPageSkeleton,
  RegisterPageSkeleton,
} from "@/components/common/PageSkeletons";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";

const LoginPage = lazyPage(
  () => import("@/features/auth/pages/LoginPage").then((m) => m.LoginPage),
  <LoginPageSkeleton />,
);
const RegisterPage = lazyPage(
  () => import("@/features/auth/pages/RegisterPage").then((m) => m.RegisterPage),
  <RegisterPageSkeleton />,
);

/** เข้าสู่ระบบ / สมัครสมาชิก — ใช้ AuthLayout (การ์ดกลางจอ ไม่มี Navbar) */
export const authRoutes: RouteObject = {
  element: (
    <RedirectIfAuthenticated>
      <AuthLayout />
    </RedirectIfAuthenticated>
  ),
  children: [
    { path: "login", handle: { title: msg("routes.title.auth.login", "เข้าสู่ระบบ") }, element: <LoginPage /> },
    { path: "register", handle: { title: msg("routes.title.auth.register", "สมัครสมาชิก") }, element: <RegisterPage /> },
  ],
};

// key ของ msg() ด้านบน — ประกาศให้ tolgee CLI เห็น (msg ไม่ใช่ t) [TCG-550]
// @tolgee-key {"key": "routes.title.auth.login", "ns": "common", "defaultValue": "เข้าสู่ระบบ"}
// @tolgee-key {"key": "routes.title.auth.register", "ns": "common", "defaultValue": "สมัครสมาชิก"}
