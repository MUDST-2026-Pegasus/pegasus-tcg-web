import { Navigate, type RouteObject } from "react-router-dom";

import { lazyPage } from "@/app/lazy-page";
import { msg } from "@/lib/i18n";
import { DashboardPageSkeleton } from "@/components/common/PageSkeletons";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AdminLayout } from "@/features/admin/AdminLayout";

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
 * เมนู sidebar มาจาก useAdminNav() ใน @/lib/nav-config (เปลี่ยนตามภาษา)
 * แต่ละหน้าแยก chunk ด้วย lazyPage (ดู @/app/lazy-page)
 *
 * เจ้าของไฟล์นี้: คนที่ทำ feature admin — แก้ได้เลยโดยไม่ชนกับคนอื่น
 */
export const adminRoutes: RouteObject = {
  path: "admin",
  element: (
    <RequireAuth roles={["ADMIN"]}>
      <AdminLayout />
    </RequireAuth>
  ),
  children: [
    { index: true, handle: { title: msg("routes.title.admin.index", "ภาพรวมแอดมิน") }, element: <AdminOverviewPage /> },
    { path: "catalog", handle: { title: msg("routes.title.admin.catalog", "จัดการแคตตาล็อก") }, element: <AdminCatalogPage /> },
    { path: "card-attributes", handle: { title: msg("routes.title.admin.cardAttributes", "คุณสมบัติการ์ด") }, element: <AdminCardAttributesPage /> },
    { path: "sellers", handle: { title: msg("routes.title.admin.sellers", "อนุมัติผู้ขาย") }, element: <AdminSellerApprovalPage /> },
    { path: "users", handle: { title: msg("routes.title.admin.users", "ผู้ใช้") }, element: <AdminUsersPage /> },
    { path: "orders", handle: { title: msg("routes.title.admin.orders", "คำสั่งซื้อ") }, element: <AdminOrdersPage /> },
    { path: "auctions", handle: { title: msg("routes.title.admin.auctions", "จัดการประมูล") }, element: <AdminAuctionsPage /> },
    { path: "auctions/banned-bidders", handle: { title: msg("routes.title.admin.auctionsBannedBidders", "ผู้ถูกแบนประมูล") }, element: <AdminBannedBiddersPage /> },
    { path: "auctions/:auctionId", handle: { title: msg("routes.title.admin.auctionsAuctionId", "ประมูล") }, element: <AdminAuctionDetailPage /> },
    { path: "commission", handle: { title: msg("routes.title.admin.commission", "ค่าคอมมิชชัน") }, element: <AdminCommissionPage /> },
    { path: "reports/weekly-stock-profit", handle: { title: msg("routes.title.admin.reportsWeeklyStockProfit", "รายงานประจำสัปดาห์") }, element: <AdminWeeklyReportPage /> },
    { path: "promotions", handle: { title: msg("routes.title.admin.promotions", "โปรโมชัน") }, element: <AdminPromotionsPage /> },
    { path: "promotions/new", handle: { title: msg("routes.title.admin.promotionsNew", "สร้างโปรโมชัน") }, element: <AdminPromotionFormPage /> },
    { path: "promotions/:id/edit", handle: { title: msg("routes.title.admin.promotionsIdEdit", "แก้ไขโปรโมชัน") }, element: <AdminPromotionFormPage /> },
    // ลดราคาสินค้า [TCG-681] — รายการอยู่ที่ /admin/promotions?tab=sales
    { path: "sales", element: <Navigate to="/admin/promotions?tab=sales" replace /> },
    { path: "sales/new", handle: { title: msg("routes.title.admin.salesNew", "สร้างการลดราคา") }, element: <AdminSaleFormPage /> },
    { path: "sales/:id/edit", handle: { title: msg("routes.title.admin.salesIdEdit", "แก้ไขการลดราคา") }, element: <AdminSaleFormPage /> },
    { path: "payments", handle: { title: msg("routes.title.admin.payments", "ตรวจสลิป") }, element: <AdminPaymentsPage /> },
    { path: "refunds", handle: { title: msg("routes.title.admin.refunds", "คืนเงิน") }, element: <AdminRefundsPage /> },
    { path: "payouts", handle: { title: msg("routes.title.admin.payouts", "จ่ายเงินผู้ขาย") }, element: <AdminPayoutsPage /> },
    // หน้าเดิมที่รวมสามแท็บ — ลิงก์เก่ายังพาไปหน้าตรวจสลิป
    { path: "finance", element: <Navigate to="/admin/payments" replace /> },
    { path: "reviews", handle: { title: msg("routes.title.admin.reviews", "รีวิว") }, element: <AdminReviewsPage /> },
    { path: "activity-log", handle: { title: msg("routes.title.admin.activityLog", "บันทึกกิจกรรม") }, element: <AdminActivityLogPage /> },
  ],
};

// key ของ msg() ด้านบน — ประกาศให้ tolgee CLI เห็น (msg ไม่ใช่ t) [TCG-550]
// @tolgee-key {"key": "routes.title.admin.index", "ns": "common", "defaultValue": "ภาพรวมแอดมิน"}
// @tolgee-key {"key": "routes.title.admin.catalog", "ns": "common", "defaultValue": "จัดการแคตตาล็อก"}
// @tolgee-key {"key": "routes.title.admin.cardAttributes", "ns": "common", "defaultValue": "คุณสมบัติการ์ด"}
// @tolgee-key {"key": "routes.title.admin.sellers", "ns": "common", "defaultValue": "อนุมัติผู้ขาย"}
// @tolgee-key {"key": "routes.title.admin.users", "ns": "common", "defaultValue": "ผู้ใช้"}
// @tolgee-key {"key": "routes.title.admin.orders", "ns": "common", "defaultValue": "คำสั่งซื้อ"}
// @tolgee-key {"key": "routes.title.admin.auctions", "ns": "common", "defaultValue": "จัดการประมูล"}
// @tolgee-key {"key": "routes.title.admin.auctionsBannedBidders", "ns": "common", "defaultValue": "ผู้ถูกแบนประมูล"}
// @tolgee-key {"key": "routes.title.admin.auctionsAuctionId", "ns": "common", "defaultValue": "ประมูล"}
// @tolgee-key {"key": "routes.title.admin.commission", "ns": "common", "defaultValue": "ค่าคอมมิชชัน"}
// @tolgee-key {"key": "routes.title.admin.reportsWeeklyStockProfit", "ns": "common", "defaultValue": "รายงานประจำสัปดาห์"}
// @tolgee-key {"key": "routes.title.admin.promotions", "ns": "common", "defaultValue": "โปรโมชัน"}
// @tolgee-key {"key": "routes.title.admin.promotionsNew", "ns": "common", "defaultValue": "สร้างโปรโมชัน"}
// @tolgee-key {"key": "routes.title.admin.promotionsIdEdit", "ns": "common", "defaultValue": "แก้ไขโปรโมชัน"}
// @tolgee-key {"key": "routes.title.admin.salesNew", "ns": "common", "defaultValue": "สร้างการลดราคา"}
// @tolgee-key {"key": "routes.title.admin.salesIdEdit", "ns": "common", "defaultValue": "แก้ไขการลดราคา"}
// @tolgee-key {"key": "routes.title.admin.payments", "ns": "common", "defaultValue": "ตรวจสลิป"}
// @tolgee-key {"key": "routes.title.admin.refunds", "ns": "common", "defaultValue": "คืนเงิน"}
// @tolgee-key {"key": "routes.title.admin.payouts", "ns": "common", "defaultValue": "จ่ายเงินผู้ขาย"}
// @tolgee-key {"key": "routes.title.admin.reviews", "ns": "common", "defaultValue": "รีวิว"}
// @tolgee-key {"key": "routes.title.admin.activityLog", "ns": "common", "defaultValue": "บันทึกกิจกรรม"}
