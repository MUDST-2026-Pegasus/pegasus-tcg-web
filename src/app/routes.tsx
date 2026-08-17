import { Route, Routes } from "react-router-dom";

import { adminNav, sellerNav } from "#lib/nav-config";
import { AuthLayout } from "#components/layout/AuthLayout";
import { DashboardLayout } from "#components/layout/DashboardLayout";
import { PublicLayout } from "#components/layout/PublicLayout";
import { PagePlaceholder } from "#components/PagePlaceholder";

import { AboutPage } from "#features/about/pages/AboutPage";
import { AddressBookPage } from "#features/account/pages/AddressBookPage";
import { OrderHistoryPage } from "#features/account/pages/OrderHistoryPage";
import { ProfilePage } from "#features/account/pages/ProfilePage";
import { LoginPage } from "#features/auth/pages/LoginPage";
import { RegisterPage } from "#features/auth/pages/RegisterPage";
import { CartPage } from "#features/cart/pages/CartPage";
import { CheckoutPage } from "#features/cart/pages/CheckoutPage";
import { ProductDetailPage } from "#features/catalog/pages/ProductDetailPage";
import { ProductListPage } from "#features/catalog/pages/ProductListPage";
import { SearchResultsPage } from "#features/catalog/pages/SearchResultsPage";
import { HomePage } from "#features/home/pages/HomePage";
import { StoreProfilePage } from "#features/store/pages/StoreProfilePage";

import { AdminActivityLogPage } from "#features/admin/pages/AdminActivityLogPage";
import { AdminCardAttributesPage } from "#features/admin/pages/AdminCardAttributesPage";
import { AdminCatalogPage } from "#features/admin/pages/AdminCatalogPage";
import { AdminCommissionPage } from "#features/admin/pages/AdminCommissionPage";
import { AdminListingReviewPage } from "#features/admin/pages/AdminListingReviewPage";
import { AdminOrdersPage } from "#features/admin/pages/AdminOrdersPage";
import { AdminOverviewPage } from "#features/admin/pages/AdminOverviewPage";
import { AdminSellerApprovalPage } from "#features/admin/pages/AdminSellerApprovalPage";
import { AdminUsersPage } from "#features/admin/pages/AdminUsersPage";

import { SellerDashboardPage } from "#features/seller/pages/SellerDashboardPage";
import { SellerLogoutPage } from "#features/seller/pages/SellerLogoutPage";
import { SellerOrdersPage } from "#features/seller/pages/SellerOrdersPage";
import { SellerPayoutPage } from "#features/seller/pages/SellerPayoutPage";
import { SellerProductsPage } from "#features/seller/pages/SellerProductsPage";
import { SellerShopPage } from "#features/seller/pages/SellerShopPage";

/**
 * ตารางเส้นทางของทั้งแอป — จัดกลุ่มตาม layout เพื่อไม่ต้อง import
 * Navbar / Sidebar / Footer ซ้ำในทุกหน้า
 *
 * ไฟล์นี้เป็นไฟล์ที่คนชนกันง่ายที่สุด ถ้าจะเพิ่ม route ใหม่ให้แจ้งในกลุ่มก่อน
 * งานปกติ (ทำหน้าให้เสร็จ) แก้แค่ไฟล์ใน features/<ของตัวเอง>/ เท่านั้น
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* ---------- ผู้ซื้อ / หน้าสาธารณะ ---------- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        {/* หมวดหมู่ที่ Navbar ลิงก์ไป — ใช้ ProductListPage ตัวเดียวกัน
            แยก path เพื่อให้ NavLink ไฮไลต์เมนูที่ถูกต้อง */}
        <Route path="/sale" element={<ProductListPage />} />
        <Route path="/new-arrivals" element={<ProductListPage />} />
        <Route path="/pokemon" element={<ProductListPage />} />
        <Route path="/one-piece" element={<ProductListPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/store/:storeId" element={<StoreProfilePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/account/profile" element={<ProfilePage />} />
        <Route path="/account/orders" element={<OrderHistoryPage />} />
        <Route path="/account/addresses" element={<AddressBookPage />} />
        {/* ไม่พบหน้า — react-router จัดอันดับ "*" ไว้ท้ายสุดเสมอ
            ไม่ขึ้นกับลำดับที่เขียน จึงไม่บังเส้นทางอื่น */}
        <Route path="*" element={<PagePlaceholder title="ไม่พบหน้านี้" />} />
      </Route>

      {/* ---------- เข้าสู่ระบบ / สมัครสมาชิก ---------- */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* ---------- หลังบ้าน: ผู้ดูแลระบบ ---------- */}
      <Route
        path="/admin"
        element={<DashboardLayout role="ADMIN" groups={adminNav} />}
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="catalog" element={<AdminCatalogPage />} />
        <Route path="card-attributes" element={<AdminCardAttributesPage />} />
        <Route path="sellers" element={<AdminSellerApprovalPage />} />
        <Route path="listings" element={<AdminListingReviewPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="commission" element={<AdminCommissionPage />} />
        <Route path="activity-log" element={<AdminActivityLogPage />} />
      </Route>

      {/* ---------- หลังบ้าน: ผู้ขาย ---------- */}
      <Route
        path="/seller"
        element={<DashboardLayout role="SELLER" groups={sellerNav} />}
      >
        <Route index element={<SellerDashboardPage />} />
        <Route path="shop" element={<SellerShopPage />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="payout" element={<SellerPayoutPage />} />
        <Route path="logout" element={<SellerLogoutPage />} />
      </Route>
    </Routes>
  );
}
