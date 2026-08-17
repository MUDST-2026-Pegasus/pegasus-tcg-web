import type { RouteObject } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  SellerDashboardPage,
  SellerLogoutPage,
  SellerOrdersPage,
  SellerPayoutPage,
  SellerProductsPage,
  SellerShopPage,
} from "@/features/seller";
import { sellerNav } from "@/lib/nav-config";

/**
 * หลังบ้านฝั่งผู้ขาย — ใช้ DashboardLayout ตัวเดียวกับ admin
 * ต่างแค่ groups ที่ส่งเข้าไป
 *
 * เจ้าของไฟล์นี้: คนที่ทำ feature seller — แก้ได้เลยโดยไม่ชนกับคนอื่น
 */
export const sellerRoutes: RouteObject = {
  path: "seller",
  element: <DashboardLayout role="SELLER" groups={sellerNav} />,
  children: [
    { index: true, element: <SellerDashboardPage /> },
    { path: "shop", element: <SellerShopPage /> },
    { path: "products", element: <SellerProductsPage /> },
    { path: "orders", element: <SellerOrdersPage /> },
    { path: "payout", element: <SellerPayoutPage /> },
    { path: "logout", element: <SellerLogoutPage /> },
  ],
};
