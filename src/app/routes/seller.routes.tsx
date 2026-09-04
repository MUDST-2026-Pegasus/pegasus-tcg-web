import type { RouteObject } from "react-router-dom";

import { SellerLayout } from "@/features/seller/components/SellerLayout";
import { SellerDashboardPage } from "@/features/seller/pages/SellerDashboardPage";
import { SellerLogoutPage } from "@/features/seller/pages/SellerLogoutPage";
import { SellerOrdersPage } from "@/features/seller/pages/SellerOrdersPage";
import { SellerPayoutPage } from "@/features/seller/pages/SellerPayoutPage";
import { SellerProductsPage } from "@/features/seller/pages/SellerProductsPage";
import { SellerShopPage } from "@/features/seller/pages/SellerShopPage";
import { SELLER_PROFILE_FIXTURE } from "@/features/seller/seller.fixture";

/**
 * หลังบ้านฝั่งผู้ขาย — ใช้ SellerLayout ของตัวเอง (sidebar แยกจาก admin)
 *
 * เจ้าของไฟล์นี้: คนที่ทำ feature seller — แก้ได้เลยโดยไม่ชนกับคนอื่น
 */
export const sellerRoutes: RouteObject = {
  path: "seller",
  element: <SellerLayout profile={SELLER_PROFILE_FIXTURE} />,
  children: [
    { index: true, element: <SellerDashboardPage /> },
    { path: "shop", element: <SellerShopPage /> },
    { path: "products", element: <SellerProductsPage /> },
    { path: "orders", element: <SellerOrdersPage /> },
    { path: "payout", element: <SellerPayoutPage /> },
    { path: "logout", element: <SellerLogoutPage /> },
  ],
};
