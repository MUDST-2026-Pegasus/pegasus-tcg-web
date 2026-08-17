import type { RouteObject } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  AdminActivityLogPage,
  AdminCardAttributesPage,
  AdminCatalogPage,
  AdminCommissionPage,
  AdminListingReviewPage,
  AdminOrdersPage,
  AdminOverviewPage,
  AdminSellerApprovalPage,
  AdminUsersPage,
} from "@/features/admin";
import { adminNav } from "@/lib/nav-config";

/**
 * หลังบ้านฝั่งผู้ดูแลระบบ — ใช้ DashboardLayout (Sidebar + topbar + Footer)
 * เมนู sidebar มาจาก adminNav ใน @/lib/nav-config
 *
 * เจ้าของไฟล์นี้: คนที่ทำ feature admin — แก้ได้เลยโดยไม่ชนกับคนอื่น
 */
export const adminRoutes: RouteObject = {
  path: "admin",
  element: <DashboardLayout role="ADMIN" groups={adminNav} />,
  children: [
    { index: true, element: <AdminOverviewPage /> },
    { path: "catalog", element: <AdminCatalogPage /> },
    { path: "card-attributes", element: <AdminCardAttributesPage /> },
    { path: "sellers", element: <AdminSellerApprovalPage /> },
    { path: "listings", element: <AdminListingReviewPage /> },
    { path: "users", element: <AdminUsersPage /> },
    { path: "orders", element: <AdminOrdersPage /> },
    { path: "commission", element: <AdminCommissionPage /> },
    { path: "activity-log", element: <AdminActivityLogPage /> },
  ],
};
