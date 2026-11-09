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
const AdminWeeklyReportPage = lazyPage(() => import("@/features/admin/pages/AdminWeeklyReportPage").then((m) => m.AdminWeeklyReportPage), pageSkeleton);
const AdminPaymentsPage = lazyPage(() => import("@/features/admin/pages/AdminPaymentsPage").then((m) => m.AdminPaymentsPage), pageSkeleton);
const AdminRefundsPage = lazyPage(() => import("@/features/admin/pages/AdminRefundsPage").then((m) => m.AdminRefundsPage), pageSkeleton);
const AdminPayoutsPage = lazyPage(() => import("@/features/admin/pages/AdminPayoutsPage").then((m) => m.AdminPayoutsPage), pageSkeleton);
const AdminReviewsPage = lazyPage(() => import("@/features/admin/pages/AdminReviewsPage").then((m) => m.AdminReviewsPage), pageSkeleton);
const AdminAuctionsPage = lazyPage(() => import("@/features/admin/auctions/AdminAuctionsPage").then((m) => m.AdminAuctionsPage), pageSkeleton);
const AdminAuctionDetailPage = lazyPage(() => import("@/features/admin/auctions/AdminAuctionDetailPage").then((m) => m.AdminAuctionDetailPage), pageSkeleton);
const AdminBannedBiddersPage = lazyPage(() => import("@/features/admin/auctions/AdminBannedBiddersPage").then((m) => m.AdminBannedBiddersPage), pageSkeleton);
const AdminActivityLogPage = lazyPage(() => import("@/features/admin/pages/AdminActivityLogPage").then((m) => m.AdminActivityLogPage), pageSkeleton);
const AdminPromotionsPage = lazyPage(() => import("@/features/admin/pages/AdminPromotionsPage").then((m) => m.AdminPromotionsPage), pageSkeleton);
const AdminPromotionFormPage = lazyPage(() => import("@/features/admin/pages/AdminPromotionFormPage").then((m) => m.AdminPromotionFormPage), pageSkeleton);
const AdminSaleFormPage = lazyPage(() => import("@/features/admin/pages/AdminSaleFormPage").then((m) => m.AdminSaleFormPage), pageSkeleton);

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
    { index: true, handle: { title: "ภาพรวมแอดมิน" }, element: <AdminOverviewPage /> },
    { path: "catalog", handle: { title: "จัดการแคตตาล็อก" }, element: <AdminCatalogPage /> },
    { path: "card-attributes", handle: { title: "คุณสมบัติการ์ด" }, element: <AdminCardAttributesPage /> },
    { path: "sellers", handle: { title: "อนุมัติผู้ขาย" }, element: <AdminSellerApprovalPage /> },
    { path: "users", handle: { title: "ผู้ใช้" }, element: <AdminUsersPage /> },
    { path: "orders", handle: { title: "คำสั่งซื้อ" }, element: <AdminOrdersPage /> },
    { path: "auctions", handle: { title: "จัดการประมูล" }, element: <AdminAuctionsPage /> },
    { path: "auctions/banned-bidders", handle: { title: "ผู้ถูกแบนประมูล" }, element: <AdminBannedBiddersPage /> },
    { path: "auctions/:auctionId", handle: { title: "ประมูล" }, element: <AdminAuctionDetailPage /> },
    { path: "commission", handle: { title: "ค่าคอมมิชชัน" }, element: <AdminCommissionPage /> },
    { path: "reports/weekly-stock-profit", handle: { title: "รายงานประจำสัปดาห์" }, element: <AdminWeeklyReportPage /> },
    { path: "promotions", handle: { title: "โปรโมชัน" }, element: <AdminPromotionsPage /> },
    { path: "promotions/new", handle: { title: "สร้างโปรโมชัน" }, element: <AdminPromotionFormPage /> },
    { path: "promotions/:id/edit", handle: { title: "แก้ไขโปรโมชัน" }, element: <AdminPromotionFormPage /> },
    // ลดราคาสินค้า [TCG-681] — รายการอยู่ที่ /admin/promotions?tab=sales
    { path: "sales", element: <Navigate to="/admin/promotions?tab=sales" replace /> },
    { path: "sales/new", handle: { title: "สร้างการลดราคา" }, element: <AdminSaleFormPage /> },
    { path: "sales/:id/edit", handle: { title: "แก้ไขการลดราคา" }, element: <AdminSaleFormPage /> },
    { path: "payments", handle: { title: "ตรวจสลิป" }, element: <AdminPaymentsPage /> },
    { path: "refunds", handle: { title: "คืนเงิน" }, element: <AdminRefundsPage /> },
    { path: "payouts", handle: { title: "จ่ายเงินผู้ขาย" }, element: <AdminPayoutsPage /> },
    // หน้าเดิมที่รวมสามแท็บ — ลิงก์เก่ายังพาไปหน้าตรวจสลิป
    { path: "finance", element: <Navigate to="/admin/payments" replace /> },
    { path: "reviews", handle: { title: "รีวิว" }, element: <AdminReviewsPage /> },
    { path: "activity-log", handle: { title: "บันทึกกิจกรรม" }, element: <AdminActivityLogPage /> },
  ],
};
