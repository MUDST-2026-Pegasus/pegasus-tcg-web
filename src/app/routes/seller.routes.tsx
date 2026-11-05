import type { RouteObject } from "react-router-dom";

import { lazyPage } from "@/app/lazy-page";
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
const SellerAuctionsPage = lazyPage(() => import("@/features/auction/pages/SellerAuctionsPage").then((m) => m.SellerAuctionsPage), pageSkeleton);
const SellerAuctionCreatePage = lazyPage(() => import("@/features/auction/pages/SellerAuctionCreatePage").then((m) => m.SellerAuctionCreatePage), formSkeleton);
const SellerAuctionDetailPage = lazyPage(() => import("@/features/auction/pages/SellerAuctionDetailPage").then((m) => m.SellerAuctionDetailPage), pageSkeleton);
const SellerLogoutPage = lazyPage(() => import("@/features/seller/logout/SellerLogoutPage").then((m) => m.SellerLogoutPage), pageSkeleton);
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
    { index: true, element: <SellerDashboardPage /> },
    { path: "shop", element: <SellerShopPage /> },
    { path: "products", element: <SellerProductsPage /> },
    { path: "products/new", element: <SellerProductCreatePage /> },
    {
      path: "products/:productId/restock",
      element: <SellerProductRestockPage />,
    },
    { path: "products/:productId/edit", element: <SellerProductEditPage /> },
    { path: "orders", element: <SellerOrdersPage /> },
    { path: "promotions", element: <SellerPromotionsPage /> },
    { path: "orders/:orderId", element: <SellerOrderDetailPage /> },
    { path: "payout", element: <SellerPayoutPage /> },
    { path: "verification", element: <SellerVerificationPage /> },
    { path: "returns", element: <SellerReturnsPage /> },
    { path: "reviews", element: <SellerReviewsPage /> },
    { path: "auctions", element: <SellerAuctionsPage /> },
    { path: "auctions/new", element: <SellerAuctionCreatePage /> },
    { path: "auctions/:auctionId", element: <SellerAuctionDetailPage /> },
    { path: "logout", element: <SellerLogoutPage /> },
  ],
};
