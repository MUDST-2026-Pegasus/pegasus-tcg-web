import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/auth.queries";
import { authRedirectTarget, rememberPendingClaim } from "@/features/promotions/claim-redirect";

type RedirectIfAuthenticatedProps = {
  to?: string;
  children?: ReactNode;
};

/**
 * ถ้าถูกเด้งมาจากหน้าที่ต้อง login (หรือมี `?next=`) จะพากลับไปหน้านั้นแทนหน้าแรก
 * มากับ `?claim=` = guest กดเก็บโค้ดไว้ — จำไว้ให้หน้าที่กลับไปเก็บให้อัตโนมัติ
 */
export function RedirectIfAuthenticated({
  to = "/",
  children,
}: RedirectIfAuthenticatedProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isAuthenticated && !isLoading) {
    rememberPendingClaim(location.search);
    return <Navigate to={authRedirectTarget(location.search, location.state, to)} replace />;
  }

  return children ?? <Outlet />;
}
