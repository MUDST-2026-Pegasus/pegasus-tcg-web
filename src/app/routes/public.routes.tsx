import type { RouteObject } from "react-router-dom";

import { PagePlaceholder } from "@/components/common/PagePlaceholder";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AboutPage } from "@/features/about/pages/AboutPage";
import { AddressBookPage } from "@/features/account/pages/AddressBookPage";
import { OrderHistoryPage } from "@/features/account/pages/OrderHistoryPage";
import { ProfilePage } from "@/features/account/pages/ProfilePage";
import { CartPage } from "@/features/cart/pages/CartPage";
import { CheckoutPage } from "@/features/cart/pages/CheckoutPage";
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage";
import { ProductListPage } from "@/features/catalog/pages/ProductListPage";
import { SearchResultsPage } from "@/features/catalog/pages/SearchResultsPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { StoreProfilePage } from "@/features/store/pages/StoreProfilePage";

/** เส้นทางฝั่งผู้ซื้อ / หน้าสาธารณะ — ใช้ PublicLayout (Navbar + Footer) */
export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { index: true, element: <HomePage /> },

    { path: "products", element: <ProductListPage /> },
    { path: "products/:productId", element: <ProductDetailPage /> },
    // หมวดหมู่ที่ Navbar ลิงก์ไป — ใช้ ProductListPage ตัวเดียวกัน
    // แยก path เพื่อให้ NavLink ไฮไลต์เมนูที่ถูกต้อง
    { path: "sale", element: <ProductListPage /> },
    { path: "new-arrivals", element: <ProductListPage /> },
    { path: "pokemon", element: <ProductListPage /> },
    { path: "one-piece", element: <ProductListPage /> },
    { path: "search", element: <SearchResultsPage /> },

    { path: "store/:storeId", element: <StoreProfilePage /> },

    { path: "cart", element: <CartPage /> },
    { path: "checkout", element: <CheckoutPage /> },

    { path: "about", element: <AboutPage /> },

    { path: "account/profile", element: <ProfilePage /> },
    { path: "account/orders", element: <OrderHistoryPage /> },
    { path: "account/addresses", element: <AddressBookPage /> },

    { path: "*", element: <PagePlaceholder title="ไม่พบหน้านี้" /> },
  ],
};
