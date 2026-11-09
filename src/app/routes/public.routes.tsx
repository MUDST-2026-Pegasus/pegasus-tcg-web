import type { RouteObject } from "react-router-dom";

import { lazyPage } from "@/app/lazy-page";
import {
  AccountPageSkeleton,
  ArticlePageSkeleton,
  CatalogPageSkeleton,
  DetailPageSkeleton,
  FormPageSkeleton,
  ProfilePageSkeleton,
} from "@/components/common/PageSkeletons";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AccountLayout } from "@/features/account/components/AccountLayout";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import {
  LegacyGameRedirect,
  LegacyProductsRedirect,
} from "@/features/catalog/LegacyRedirects";
import { HomePageSkeleton } from "@/features/home/components/HomePageSkeleton";
import { StoreRedirect } from "@/features/store/components/StoreRedirect";

/*
 * ทุกหน้าแยก chunk ด้วย lazyPage — ระหว่างโหลดโค้ดจะเห็น skeleton ทรงเดียวกับหน้านั้น
 * เพิ่มหน้าใหม่: import แบบ `() => import(...).then((m) => m.X)` แล้วเลือก skeleton ที่ใกล้ที่สุด
 */
const HomePage = lazyPage(() => import("@/features/home/pages/HomePage").then((m) => m.HomePage), <HomePageSkeleton />);

const ProductDetailPage = lazyPage(() => import("@/features/catalog/pages/ProductDetailPage").then((m) => m.ProductDetailPage), <DetailPageSkeleton label="กำลังโหลดสินค้า" />);
const CollectorProfilePage = lazyPage(() => import("@/features/catalog/pages/CollectorProfilePage").then((m) => m.CollectorProfilePage), <ProfilePageSkeleton label="กำลังโหลดโปรไฟล์นักสะสม" />);
const MarketListingsPage = lazyPage(() => import("@/features/catalog/pages/MarketListingsPage").then((m) => m.MarketListingsPage), <DetailPageSkeleton label="กำลังโหลดประกาศขาย" />);
const ListingDetailPage = lazyPage(() => import("@/features/catalog/pages/ListingDetailPage").then((m) => m.ListingDetailPage), <DetailPageSkeleton label="กำลังโหลดประกาศขาย" />);
const SalePage = lazyPage(() => import("@/features/sale/pages/SalePage").then((m) => m.SalePage), <CatalogPageSkeleton label="กำลังโหลดสินค้าลดราคา" />);
const SearchResultsPage = lazyPage(() => import("@/features/catalog/pages/SearchResultsPage").then((m) => m.SearchResultsPage), <CatalogPageSkeleton label="กำลังโหลดผลการค้นหา" />);

const PublicSellerPage = lazyPage(() => import("@/features/store/pages/PublicSellerPage").then((m) => m.PublicSellerPage), <ProfilePageSkeleton label="กำลังโหลดร้านค้า" />);
const PublicCollectionPage = lazyPage(() => import("@/features/collection/pages/PublicCollectionPage").then((m) => m.PublicCollectionPage), <ProfilePageSkeleton label="กำลังโหลดคอลเลกชัน" />);

const CartPage = lazyPage(() => import("@/features/cart/pages/CartPage").then((m) => m.CartPage), <FormPageSkeleton label="กำลังโหลดตะกร้า" />);
const CheckoutPage = lazyPage(() => import("@/features/cart/pages/CheckoutPage").then((m) => m.CheckoutPage), <FormPageSkeleton label="กำลังโหลดหน้าชำระเงิน" />);

const AboutPage = lazyPage(() => import("@/features/about/pages/AboutPage").then((m) => m.AboutPage), <ArticlePageSkeleton />);
const TermsOfServicePage = lazyPage(() => import("@/features/legal/pages/TermsOfServicePage").then((m) => m.TermsOfServicePage), <ArticlePageSkeleton />);
const PrivacyPolicyPage = lazyPage(() => import("@/features/legal/pages/PrivacyPolicyPage").then((m) => m.PrivacyPolicyPage), <ArticlePageSkeleton />);

const PaymentPage = lazyPage(() => import("@/features/payment/pages/PaymentPage").then((m) => m.PaymentPage), <FormPageSkeleton label="กำลังโหลดหน้าชำระเงิน" />);
const PaymentSuccessPage = lazyPage(() => import("@/features/payment/pages/PaymentSuccessPage").then((m) => m.PaymentSuccessPage), <FormPageSkeleton />);
const ProfilePage = lazyPage(() => import("@/features/account/pages/ProfilePage").then((m) => m.ProfilePage), <AccountPageSkeleton label="กำลังโหลดโปรไฟล์" />);
const OrderHistoryPage = lazyPage(() => import("@/features/account/pages/OrderHistoryPage").then((m) => m.OrderHistoryPage), <AccountPageSkeleton label="กำลังโหลดคำสั่งซื้อ" />);
const AddressBookPage = lazyPage(() => import("@/features/account/pages/AddressBookPage").then((m) => m.AddressBookPage), <AccountPageSkeleton label="กำลังโหลดที่อยู่" />);
const MyCouponsPage = lazyPage(() => import("@/features/account/pages/MyCouponsPage").then((m) => m.MyCouponsPage), <AccountPageSkeleton label="กำลังโหลดโค้ดของฉัน" />);
const MyCollectionPage = lazyPage(() => import("@/features/collection/pages/MyCollectionPage").then((m) => m.MyCollectionPage), <CatalogPageSkeleton label="กำลังโหลดคอลเลกชัน" />);
const SellerApplicationPage = lazyPage(() => import("@/features/seller/application/SellerApplicationPage").then((m) => m.SellerApplicationPage), <FormPageSkeleton />);
const AuctionListPage = lazyPage(() => import("@/features/auction/pages/AuctionListPage").then((m) => m.AuctionListPage), <CatalogPageSkeleton label="กำลังโหลดประมูล" />);
const AuctionDetailPage = lazyPage(() => import("@/features/auction/pages/AuctionDetailPage").then((m) => m.AuctionDetailPage), <DetailPageSkeleton label="กำลังโหลดประมูล" />);
const MyAuctionsPage = lazyPage(() => import("@/features/auction/pages/MyAuctionsPage").then((m) => m.MyAuctionsPage), <AccountPageSkeleton label="กำลังโหลดการประมูลของฉัน" />);
const NotFoundPage = lazyPage(() => import("@/features/not-found/pages/NotFoundPage").then((m) => m.NotFoundPage), <ArticlePageSkeleton />);


/** เส้นทางฝั่งผู้ซื้อ / หน้าสาธารณะ — ใช้ PublicLayout (Navbar + Footer) */
export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { index: true, handle: { title: "หน้าแรก" }, element: <HomePage /> },

    { path: "products", element: <LegacyProductsRedirect /> },
    { path: "products/:productId", handle: { title: "สินค้า" }, element: <ProductDetailPage /> },
    { path: "collectors/:username", handle: { title: "นักสะสม" }, element: <CollectorProfilePage /> },
    { path: "products/:productId/listings", handle: { title: "ประกาศขาย" }, element: <MarketListingsPage /> },
    { path: "listings/:listingId", handle: { title: "ประกาศขาย" }, element: <ListingDetailPage /> },
    { path: "pokemon", element: <LegacyGameRedirect gameCode="POKEMON" fallbackSlug="pokemon-tcg" /> },
    { path: "one-piece", element: <LegacyGameRedirect gameCode="ONE_PIECE" fallbackSlug="one-piece-card-game" /> },
    { path: "search", handle: { title: "ค้นหา" }, element: <SearchResultsPage /> },
    // หน้า SALE — ราคาลดแล้วไม่ต้องใช้โค้ด [TCG-683]
    { path: "sale", handle: { title: "สินค้าลดราคา" }, element: <SalePage /> },
    { path: "sale/:slug", handle: { title: "สินค้าลดราคา" }, element: <SalePage /> },
    // ระบบประมูล [TCG-627] — guest ดูได้ บิดต้องล็อกอิน (เช็กตอนกดบิด)
    { path: "auctions", handle: { title: "ประมูล" }, element: <AuctionListPage /> },
    { path: "auctions/:auctionId", handle: { title: "ประมูล" }, element: <AuctionDetailPage /> },

    { path: "store/:storeId", element: <StoreRedirect /> },
    { path: "u/:username", handle: { title: "ร้านค้า" }, element: <PublicSellerPage /> },
    { path: "users/:username", handle: { title: "คอลเลกชัน" }, element: <PublicCollectionPage /> },

    { path: "cart", handle: { title: "ตะกร้าสินค้า" }, element: <CartPage /> },
    { path: "checkout", handle: { title: "ชำระเงิน" }, element: <CheckoutPage /> },

    { path: "about", handle: { title: "เกี่ยวกับเรา" }, element: <AboutPage /> },
    { path: "terms-of-service", handle: { title: "ข้อตกลงการใช้งาน" }, element: <TermsOfServicePage /> },
    { path: "privacy-policy", handle: { title: "นโยบายความเป็นส่วนตัว" }, element: <PrivacyPolicyPage /> },

    {
      element: <RequireAuth />,
      children: [
        { path: "payment", handle: { title: "ชำระเงิน" }, element: <PaymentPage /> },
        { path: "payment/success", handle: { title: "ชำระเงินสำเร็จ" }, element: <PaymentSuccessPage /> },
        // sidebar อยู่ใน AccountLayout — เปลี่ยนแท็บแล้วโหลดใหม่แค่เนื้อหา [TCG-732]
        {
          path: "account",
          element: <AccountLayout />,
          children: [
            { path: "profile", handle: { title: "โปรไฟล์" }, element: <ProfilePage /> },
            { path: "orders", handle: { title: "คำสั่งซื้อของฉัน" }, element: <OrderHistoryPage /> },
            { path: "addresses", handle: { title: "ที่อยู่" }, element: <AddressBookPage /> },
            { path: "coupons", handle: { title: "โค้ดของฉัน" }, element: <MyCouponsPage /> },
            { path: "auctions", handle: { title: "การประมูลของฉัน" }, element: <MyAuctionsPage /> },
          ],
        },
        // คอลเลกชันใช้หน้าเต็มของตัวเอง ไม่มี sidebar
        { path: "account/collection", handle: { title: "คอลเลกชันของฉัน" }, element: <MyCollectionPage /> },
        // ยื่นคำขอผ่าน /sellers/me ต้องรู้ว่าเป็นใคร
        { path: "become-a-seller", handle: { title: "สมัครเป็นผู้ขาย" }, element: <SellerApplicationPage /> },
      ],
    },

    { path: "*", handle: { title: "ไม่พบหน้านี้" }, element: <NotFoundPage /> },
  ],
};
