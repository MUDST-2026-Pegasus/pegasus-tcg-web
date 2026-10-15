import { Navigate, useParams, type RouteObject } from "react-router-dom";

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
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { HomePageSkeleton } from "@/features/home/components/HomePageSkeleton";

/*
 * ทุกหน้าแยก chunk ด้วย lazyPage — ระหว่างโหลดโค้ดจะเห็น skeleton ทรงเดียวกับหน้านั้น
 * เพิ่มหน้าใหม่: import แบบ `() => import(...).then((m) => m.X)` แล้วเลือก skeleton ที่ใกล้ที่สุด
 */
const HomePage = lazyPage(() => import("@/features/home/pages/HomePage").then((m) => m.HomePage), <HomePageSkeleton />);

const ProductListPage = lazyPage(() => import("@/features/catalog/pages/ProductListPage").then((m) => m.ProductListPage), <CatalogPageSkeleton label="กำลังโหลดสินค้า" />);
const ProductDetailPage = lazyPage(() => import("@/features/catalog/pages/ProductDetailPage").then((m) => m.ProductDetailPage), <DetailPageSkeleton label="กำลังโหลดสินค้า" />);
const CollectorProfilePage = lazyPage(() => import("@/features/catalog/pages/CollectorProfilePage").then((m) => m.CollectorProfilePage), <ProfilePageSkeleton label="กำลังโหลดโปรไฟล์นักสะสม" />);
const MarketListingsPage = lazyPage(() => import("@/features/catalog/pages/MarketListingsPage").then((m) => m.MarketListingsPage), <DetailPageSkeleton label="กำลังโหลดประกาศขาย" />);
const ListingDetailPage = lazyPage(() => import("@/features/catalog/pages/ListingDetailPage").then((m) => m.ListingDetailPage), <DetailPageSkeleton label="กำลังโหลดประกาศขาย" />);
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
const MyCollectionPage = lazyPage(() => import("@/features/collection/pages/MyCollectionPage").then((m) => m.MyCollectionPage), <CatalogPageSkeleton label="กำลังโหลดคอลเลกชัน" />);
const SellerApplicationPage = lazyPage(() => import("@/features/seller/application/SellerApplicationPage").then((m) => m.SellerApplicationPage), <FormPageSkeleton />);
const NotFoundPage = lazyPage(() => import("@/features/not-found/pages/NotFoundPage").then((m) => m.NotFoundPage), <ArticlePageSkeleton />);

/** หน้าร้านเดิม /store/:storeId ถูกลบแล้ว — ลิงก์เก่า (เช่นปุ่มในแบนเนอร์หน้าแรก) พาไปหน้าร้านจริงที่ /u/:username */
function StoreRedirect() {
  const { storeId = "" } = useParams();
  return <Navigate to={`/u/${encodeURIComponent(storeId)}`} replace />;
}

/** เส้นทางฝั่งผู้ซื้อ / หน้าสาธารณะ — ใช้ PublicLayout (Navbar + Footer) */
export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { index: true, element: <HomePage /> },

    { path: "products", element: <ProductListPage key="all" /> },
    { path: "products/:productId", element: <ProductDetailPage /> },
    { path: "collectors/:username", element: <CollectorProfilePage /> },
    { path: "products/:productId/listings", element: <MarketListingsPage /> },
    { path: "listings/:listingId", element: <ListingDetailPage /> },
    { path: "pokemon", element: <ProductListPage key="pokemon" gameCode="POKEMON" title="Pokémon" /> },
    { path: "one-piece", element: <ProductListPage key="one-piece" gameCode="ONE_PIECE" title="One Piece" /> },
    { path: "search", element: <SearchResultsPage /> },

    { path: "store/:storeId", element: <StoreRedirect /> },
    { path: "u/:username", element: <PublicSellerPage /> },
    { path: "users/:username", element: <PublicCollectionPage /> },

    { path: "cart", element: <CartPage /> },
    { path: "checkout", element: <CheckoutPage /> },

    { path: "about", element: <AboutPage /> },
    { path: "terms-of-service", element: <TermsOfServicePage /> },
    { path: "privacy-policy", element: <PrivacyPolicyPage /> },

    {
      element: <RequireAuth />,
      children: [
        { path: "payment", element: <PaymentPage /> },
        { path: "payment/success", element: <PaymentSuccessPage /> },
        { path: "account/profile", element: <ProfilePage /> },
        { path: "account/orders", element: <OrderHistoryPage /> },
        { path: "account/addresses", element: <AddressBookPage /> },
        { path: "account/collection", element: <MyCollectionPage /> },
        // ยื่นคำขอผ่าน /sellers/me ต้องรู้ว่าเป็นใคร
        { path: "become-a-seller", element: <SellerApplicationPage /> },
      ],
    },

    { path: "*", element: <NotFoundPage /> },
  ],
};
