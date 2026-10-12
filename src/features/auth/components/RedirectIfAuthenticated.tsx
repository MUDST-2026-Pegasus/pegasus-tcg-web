import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/auth.queries";

type RedirectIfAuthenticatedProps = {
  to?: string;
  children?: ReactNode;
};

type RedirectState = { from?: { pathname?: string } } | null;

/** ถ้าถูกเด้งมาจากหน้าที่ต้อง login จะพากลับไปหน้านั้นแทนหน้าแรก */
export function RedirectIfAuthenticated({
  to = "/",
  children,
}: RedirectIfAuthenticatedProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isAuthenticated && !isLoading) {
    const from = (location.state as RedirectState)?.from?.pathname;
    return <Navigate to={from ?? to} replace />;
  }

  return children ?? <Outlet />;
}
