import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/auth.queries";
import type { RoleCode } from "@/features/auth/auth.types";

type RequireAuthProps = {
  roles?: RoleCode[];
  redirectTo?: string;
  fallbackTo?: string;
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
  children,
}: RequireAuthProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to={fallbackTo} replace />;
  }

  return children ?? <Outlet />;
}
