import { Route, Routes } from "react-router-dom";

import { PagePlaceholder } from "@/components/common/PagePlaceholder";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { adminNav, sellerNav } from "@/lib/nav-config";

import { AboutPage } from "@/features/about";
import { AddressBookPage, OrderHistoryPage, ProfilePage } from "@/features/account";
import { LoginPage, RegisterPage } from "@/features/auth";
import { CartPage, CheckoutPage } from "@/features/cart";
import {
  ProductDetailPage,
  ProductListPage,
  SearchResultsPage,
} from "@/features/catalog";
import { HomePage } from "@/features/home";
import { StoreProfilePage } from "@/features/store";
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
import {
  SellerDashboardPage,
  SellerLogoutPage,
  SellerOrdersPage,
  SellerPayoutPage,
  SellerProductsPage,
  SellerShopPage,
} from "@/features/seller";

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
