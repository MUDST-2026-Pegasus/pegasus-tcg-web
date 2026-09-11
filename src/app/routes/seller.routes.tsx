import type { RouteObject } from "react-router-dom";

import { SellerDashboardPage } from "@/features/seller/dashboard/SellerDashboardPage";
import { SellerLogoutPage } from "@/features/seller/logout/SellerLogoutPage";
import { SellerOrdersPage } from "@/features/seller/orders/SellerOrdersPage";
import { SellerPayoutPage } from "@/features/seller/payout/SellerPayoutPage";
import { SellerProductsPage } from "@/features/seller/products/SellerProductsPage";
import { SellerLayout } from "@/features/seller/shared/SellerLayout";
import { getSellerProfile } from "@/features/seller/shared/seller.api";
import { SellerShopPage } from "@/features/seller/shop/SellerShopPage";

/**
 * หลังบ้านฝั่งผู้ขาย — ใช้ SellerLayout ของตัวเอง (sidebar แยกจาก admin)
 * แต่ละหน้าเป็นโมดูลของตัวเองใน features/seller/<หน้า>/
 *
 * เจ้าของไฟล์นี้: คนที่ทำ feature seller — แก้ได้เลยโดยไม่ชนกับคนอื่น
 */
export const sellerRoutes: RouteObject = {
  path: "seller",
  element: <SellerLayout profile={getSellerProfile()} />,
  children: [
    { index: true, element: <SellerDashboardPage /> },
    { path: "shop", element: <SellerShopPage /> },
    { path: "products", element: <SellerProductsPage /> },
    { path: "orders", element: <SellerOrdersPage /> },
    { path: "payout", element: <SellerPayoutPage /> },
    { path: "logout", element: <SellerLogoutPage /> },
  ],
};
