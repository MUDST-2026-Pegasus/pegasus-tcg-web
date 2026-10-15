import { Navigate, type RouteObject } from "react-router-dom";

import { lazyPage } from "@/app/lazy-page";
import { DashboardPageSkeleton } from "@/components/common/PageSkeletons";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { adminNav } from "@/lib/nav-config";

const pageSkeleton = <DashboardPageSkeleton />;

const AdminOverviewPage = lazyPage(() => import("@/features/admin/pages/AdminOverviewPage").then((m) => m.AdminOverviewPage), pageSkeleton);
const AdminCatalogPage = lazyPage(() => import("@/features/admin/pages/AdminCatalogPage").then((m) => m.AdminCatalogPage), pageSkeleton);
const AdminCardAttributesPage = lazyPage(() => import("@/features/admin/pages/AdminCardAttributesPage").then((m) => m.AdminCardAttributesPage), pageSkeleton);
const AdminSellerApprovalPage = lazyPage(() => import("@/features/admin/pages/AdminSellerApprovalPage").then((m) => m.AdminSellerApprovalPage), pageSkeleton);
const AdminUsersPage = lazyPage(() => import("@/features/admin/pages/AdminUsersPage").then((m) => m.AdminUsersPage), pageSkeleton);
const AdminOrdersPage = lazyPage(() => import("@/features/admin/pages/AdminOrdersPage").then((m) => m.AdminOrdersPage), pageSkeleton);
const AdminCommissionPage = lazyPage(() => import("@/features/admin/pages/AdminCommissionPage").then((m) => m.AdminCommissionPage), pageSkeleton);
const AdminPaymentsPage = lazyPage(() => import("@/features/admin/pages/AdminPaymentsPage").then((m) => m.AdminPaymentsPage), pageSkeleton);
const AdminRefundsPage = lazyPage(() => import("@/features/admin/pages/AdminRefundsPage").then((m) => m.AdminRefundsPage), pageSkeleton);
const AdminPayoutsPage = lazyPage(() => import("@/features/admin/pages/AdminPayoutsPage").then((m) => m.AdminPayoutsPage), pageSkeleton);
const AdminReviewsPage = lazyPage(() => import("@/features/admin/pages/AdminReviewsPage").then((m) => m.AdminReviewsPage), pageSkeleton);
const AdminActivityLogPage = lazyPage(() => import("@/features/admin/pages/AdminActivityLogPage").then((m) => m.AdminActivityLogPage), pageSkeleton);

/**
 * หลังบ้านฝั่งผู้ดูแลระบบ — ใช้ DashboardLayout (Sidebar + topbar + Footer)
 * เมนู sidebar มาจาก adminNav ใน @/lib/nav-config
 * แต่ละหน้าแยก chunk ด้วย lazyPage (ดู @/app/lazy-page)
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
