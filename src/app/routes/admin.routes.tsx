import { Navigate, type RouteObject } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AdminActivityLogPage } from "@/features/admin/pages/AdminActivityLogPage";
import { AdminCardAttributesPage } from "@/features/admin/pages/AdminCardAttributesPage";
import { AdminCatalogPage } from "@/features/admin/pages/AdminCatalogPage";
import { AdminCommissionPage } from "@/features/admin/pages/AdminCommissionPage";
import { AdminOrdersPage } from "@/features/admin/pages/AdminOrdersPage";
import { AdminOverviewPage } from "@/features/admin/pages/AdminOverviewPage";
import { AdminPaymentsPage } from "@/features/admin/pages/AdminPaymentsPage";
import { AdminPayoutsPage } from "@/features/admin/pages/AdminPayoutsPage";
import { AdminRefundsPage } from "@/features/admin/pages/AdminRefundsPage";
import { AdminReviewsPage } from "@/features/admin/pages/AdminReviewsPage";
import { AdminSellerApprovalPage } from "@/features/admin/pages/AdminSellerApprovalPage";
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";
import { adminNav } from "@/lib/nav-config";

/**
 * หลังบ้านฝั่งผู้ดูแลระบบ — ใช้ DashboardLayout (Sidebar + topbar + Footer)
 * เมนู sidebar มาจาก adminNav ใน @/lib/nav-config
 *
 * เจ้าของไฟล์นี้: คนที่ทำ feature admin — แก้ได้เลยโดยไม่ชนกับคนอื่น
 */
export const adminRoutes: RouteObject = {
  path: "admin",
  element: (
    <RequireAuth roles={["ADMIN"]}>
      <DashboardLayout role="ADMIN" groups={adminNav} />
    </RequireAuth>
  ),
  children: [
    { index: true, element: <AdminOverviewPage /> },
    { path: "catalog", element: <AdminCatalogPage /> },
    { path: "card-attributes", element: <AdminCardAttributesPage /> },
    { path: "sellers", element: <AdminSellerApprovalPage /> },
    { path: "users", element: <AdminUsersPage /> },
    { path: "orders", element: <AdminOrdersPage /> },
    { path: "commission", element: <AdminCommissionPage /> },
    { path: "payments", element: <AdminPaymentsPage /> },
    { path: "refunds", element: <AdminRefundsPage /> },
    { path: "payouts", element: <AdminPayoutsPage /> },
    // หน้าเดิมที่รวมสามแท็บ — ลิงก์เก่ายังพาไปหน้าตรวจสลิป
    { path: "finance", element: <Navigate to="/admin/payments" replace /> },
    { path: "reviews", element: <AdminReviewsPage /> },
    { path: "activity-log", element: <AdminActivityLogPage /> },
  ],
};
