import type { RouteObject } from "react-router-dom";

import { lazyPage } from "@/app/lazy-page";
import { msg } from "@/lib/i18n";
import { DashboardPageSkeleton, FormBodySkeleton } from "@/components/common/PageSkeletons";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { DashboardSkeleton } from "@/features/seller/dashboard/components/DashboardSkeleton";
import { OrderDetailSkeleton } from "@/features/seller/orders/components/detail/OrderDetailSkeleton";
import { SellerLayout } from "@/features/seller/shared/SellerLayout";

const pageSkeleton = <DashboardPageSkeleton />;
const formSkeleton = <FormBodySkeleton />;

const SellerDashboardPage = lazyPage(() => import("@/features/seller/dashboard/SellerDashboardPage").then((m) => m.SellerDashboardPage), <DashboardSkeleton />);
const SellerShopPage = lazyPage(() => import("@/features/seller/shop/SellerShopPage").then((m) => m.SellerShopPage), pageSkeleton);
const SellerProductsPage = lazyPage(() => import("@/features/seller/products/SellerProductsPage").then((m) => m.SellerProductsPage), pageSkeleton);
const SellerProductCreatePage = lazyPage(() => import("@/features/seller/products/SellerProductCreatePage").then((m) => m.SellerProductCreatePage), formSkeleton);
const SellerProductRestockPage = lazyPage(() => import("@/features/seller/products/SellerProductRestockPage").then((m) => m.SellerProductRestockPage), formSkeleton);
const SellerProductEditPage = lazyPage(() => import("@/features/seller/products/SellerProductEditPage").then((m) => m.SellerProductEditPage), formSkeleton);
const SellerOrdersPage = lazyPage(() => import("@/features/seller/orders/SellerOrdersPage").then((m) => m.SellerOrdersPage), pageSkeleton);
const SellerOrderDetailPage = lazyPage(() => import("@/features/seller/orders/SellerOrderDetailPage").then((m) => m.SellerOrderDetailPage), <OrderDetailSkeleton />);
const SellerPayoutPage = lazyPage(() => import("@/features/seller/payout/SellerPayoutPage").then((m) => m.SellerPayoutPage), pageSkeleton);
const SellerVerificationPage = lazyPage(() => import("@/features/seller/payout/SellerVerificationPage").then((m) => m.SellerVerificationPage), formSkeleton);
const SellerReturnsPage = lazyPage(() => import("@/features/finance/seller-returns/SellerReturnsPage").then((m) => m.SellerReturnsPage), pageSkeleton);
const SellerReviewsPage = lazyPage(() => import("@/features/finance/SellerReviewsPage").then((m) => m.SellerReviewsPage), pageSkeleton);
const SellerAuctionsPage = lazyPage(() => import("@/features/seller/auctions/SellerAuctionsPage").then((m) => m.SellerAuctionsPage), pageSkeleton);
const SellerAuctionCreatePage = lazyPage(() => import("@/features/seller/auctions/SellerAuctionCreatePage").then((m) => m.SellerAuctionCreatePage), formSkeleton);
const SellerAuctionDetailPage = lazyPage(() => import("@/features/seller/auctions/SellerAuctionDetailPage").then((m) => m.SellerAuctionDetailPage), pageSkeleton);
const SellerLogoutPage = lazyPage(() => import("@/features/seller/logout/SellerLogoutPage").then((m) => m.SellerLogoutPage), pageSkeleton);
const SellerSaleFormPage = lazyPage(() => import("@/features/seller/sales/SellerSaleFormPage").then((m) => m.SellerSaleFormPage), formSkeleton);
const SellerPromotionsPage = lazyPage(() => import("@/features/seller/promotions/SellerPromotionsPage").then((m) => m.SellerPromotionsPage), pageSkeleton);

/**
 * หลังบ้านฝั่งผู้ขาย — ใช้ SellerLayout ของตัวเอง (sidebar แยกจาก admin)
 * แต่ละหน้าเป็นโมดูลของตัวเองใน features/seller/<หน้า>/ และแยก chunk ด้วย lazyPage
 *
 * เจ้าของไฟล์นี้: คนที่ทำ feature seller — แก้ได้เลยโดยไม่ชนกับคนอื่น
 */
export const sellerRoutes: RouteObject = {
  path: "seller",
  element: (
    <RequireAuth roles={["SELLER"]}>
      <SellerLayout />
    </RequireAuth>
  ),
  children: [
    { index: true, handle: { title: msg("routes.title.seller.index", "แดชบอร์ดผู้ขาย") }, element: <SellerDashboardPage /> },
    { path: "shop", handle: { title: msg("routes.title.seller.shop", "ร้านของฉัน") }, element: <SellerShopPage /> },
    { path: "products", handle: { title: msg("routes.title.seller.products", "สินค้าของฉัน") }, element: <SellerProductsPage /> },
    { path: "products/new", handle: { title: msg("routes.title.seller.productsNew", "เพิ่มสินค้า") }, element: <SellerProductCreatePage /> },
    {
      path: "products/:productId/restock", handle: { title: msg("routes.title.seller.productsProductIdRestock", "เติมสต็อก") },
      element: <SellerProductRestockPage />,
    },
    { path: "products/:productId/edit", handle: { title: msg("routes.title.seller.productsProductIdEdit", "แก้ไขสินค้า") }, element: <SellerProductEditPage /> },
    { path: "orders", handle: { title: msg("routes.title.seller.orders", "คำสั่งซื้อ") }, element: <SellerOrdersPage /> },
    { path: "promotions", handle: { title: msg("routes.title.seller.promotions", "โปรโมชัน") }, element: <SellerPromotionsPage /> },
    // ลดราคาสินค้าของร้าน [TCG-682] — รายการอยู่ที่ /seller/promotions?tab=sales
    { path: "sales/new", handle: { title: msg("routes.title.seller.salesNew", "สร้างการลดราคา") }, element: <SellerSaleFormPage /> },
    { path: "sales/:id/edit", handle: { title: msg("routes.title.seller.salesIdEdit", "แก้ไขการลดราคา") }, element: <SellerSaleFormPage /> },
    { path: "orders/:orderId", handle: { title: msg("routes.title.seller.ordersOrderId", "รายละเอียดคำสั่งซื้อ") }, element: <SellerOrderDetailPage /> },
    { path: "payout", handle: { title: msg("routes.title.seller.payout", "การรับเงิน") }, element: <SellerPayoutPage /> },
    { path: "verification", handle: { title: msg("routes.title.seller.verification", "ยืนยันตัวตน") }, element: <SellerVerificationPage /> },
    { path: "returns", handle: { title: msg("routes.title.seller.returns", "คืนสินค้า") }, element: <SellerReturnsPage /> },
    { path: "reviews", handle: { title: msg("routes.title.seller.reviews", "รีวิว") }, element: <SellerReviewsPage /> },
    { path: "auctions", handle: { title: msg("routes.title.seller.auctions", "ประมูลของฉัน") }, element: <SellerAuctionsPage /> },
    { path: "auctions/new", handle: { title: msg("routes.title.seller.auctionsNew", "สร้างประมูล") }, element: <SellerAuctionCreatePage /> },
    { path: "auctions/:auctionId", handle: { title: msg("routes.title.seller.auctionsAuctionId", "ประมูล") }, element: <SellerAuctionDetailPage /> },
    { path: "logout", handle: { title: msg("routes.title.seller.logout", "ออกจากระบบ") }, element: <SellerLogoutPage /> },
  ],
};

// key ของ msg() ด้านบน — ประกาศให้ tolgee CLI เห็น (msg ไม่ใช่ t) [TCG-550]
// @tolgee-key {"key": "routes.title.seller.index", "ns": "common", "defaultValue": "แดชบอร์ดผู้ขาย"}
// @tolgee-key {"key": "routes.title.seller.shop", "ns": "common", "defaultValue": "ร้านของฉัน"}
// @tolgee-key {"key": "routes.title.seller.products", "ns": "common", "defaultValue": "สินค้าของฉัน"}
// @tolgee-key {"key": "routes.title.seller.productsNew", "ns": "common", "defaultValue": "เพิ่มสินค้า"}
// @tolgee-key {"key": "routes.title.seller.productsProductIdRestock", "ns": "common", "defaultValue": "เติมสต็อก"}
// @tolgee-key {"key": "routes.title.seller.productsProductIdEdit", "ns": "common", "defaultValue": "แก้ไขสินค้า"}
// @tolgee-key {"key": "routes.title.seller.orders", "ns": "common", "defaultValue": "คำสั่งซื้อ"}
// @tolgee-key {"key": "routes.title.seller.promotions", "ns": "common", "defaultValue": "โปรโมชัน"}
// @tolgee-key {"key": "routes.title.seller.salesNew", "ns": "common", "defaultValue": "สร้างการลดราคา"}
// @tolgee-key {"key": "routes.title.seller.salesIdEdit", "ns": "common", "defaultValue": "แก้ไขการลดราคา"}
// @tolgee-key {"key": "routes.title.seller.ordersOrderId", "ns": "common", "defaultValue": "รายละเอียดคำสั่งซื้อ"}
// @tolgee-key {"key": "routes.title.seller.payout", "ns": "common", "defaultValue": "การรับเงิน"}
// @tolgee-key {"key": "routes.title.seller.verification", "ns": "common", "defaultValue": "ยืนยันตัวตน"}
// @tolgee-key {"key": "routes.title.seller.returns", "ns": "common", "defaultValue": "คืนสินค้า"}
// @tolgee-key {"key": "routes.title.seller.reviews", "ns": "common", "defaultValue": "รีวิว"}
// @tolgee-key {"key": "routes.title.seller.auctions", "ns": "common", "defaultValue": "ประมูลของฉัน"}
// @tolgee-key {"key": "routes.title.seller.auctionsNew", "ns": "common", "defaultValue": "สร้างประมูล"}
// @tolgee-key {"key": "routes.title.seller.auctionsAuctionId", "ns": "common", "defaultValue": "ประมูล"}
// @tolgee-key {"key": "routes.title.seller.logout", "ns": "common", "defaultValue": "ออกจากระบบ"}
