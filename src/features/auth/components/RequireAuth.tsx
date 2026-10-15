import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { useAuth } from "@/features/auth/auth.queries";
import type { RoleCode } from "@/features/auth/auth.types";

type RequireAuthProps = {
  roles?: RoleCode[];
  redirectTo?: string;
  fallbackTo?: string;
  /** โชว์ระหว่างรอผล `/auth/me` — ไม่ใส่ = skeleton หน้าฟอร์มกลาง ๆ */
  fallback?: ReactNode;
  /** ไม่ใส่ = ใช้เป็น layout route แล้ว render `<Outlet />` ของลูกให้ */
  children?: ReactNode;
};

/**
 * ระหว่างรอผล `/auth/me` ต้องยังไม่เด้งออก ไม่งั้นคนที่ login ค้างไว้จะโดนส่งไป
 * หน้า login ทุกครั้งที่รีเฟรชหน้าจอ
 */
export function RequireAuth({
  roles,
  redirectTo = "/login",
  fallbackTo = "/",
  fallback,
  children,
}: RequireAuthProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return fallback ?? <FormPageSkeleton label="กำลังตรวจสอบการเข้าสู่ระบบ" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to={fallbackTo} replace />;
  }

  return children ?? <Outlet />;
}
