import type { RouteObject } from "react-router-dom";

import { lazyPage } from "@/app/lazy-page";
import { msg } from "@/lib/i18n";
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

const ProductDetailPage = lazyPage(() => import("@/features/catalog/pages/ProductDetailPage").then((m) => m.ProductDetailPage), <DetailPageSkeleton label={msg("routes.loading.productDetail", "กำลังโหลดสินค้า")} />);
const CollectorProfilePage = lazyPage(() => import("@/features/catalog/pages/CollectorProfilePage").then((m) => m.CollectorProfilePage), <ProfilePageSkeleton label={msg("routes.loading.collectorProfile", "กำลังโหลดโปรไฟล์นักสะสม")} />);
const MarketListingsPage = lazyPage(() => import("@/features/catalog/pages/MarketListingsPage").then((m) => m.MarketListingsPage), <DetailPageSkeleton label={msg("routes.loading.marketListings", "กำลังโหลดประกาศขาย")} />);
const ListingDetailPage = lazyPage(() => import("@/features/catalog/pages/ListingDetailPage").then((m) => m.ListingDetailPage), <DetailPageSkeleton label={msg("routes.loading.listingDetail", "กำลังโหลดประกาศขาย")} />);
const SalePage = lazyPage(() => import("@/features/sale/pages/SalePage").then((m) => m.SalePage), <CatalogPageSkeleton label={msg("routes.loading.sale", "กำลังโหลดสินค้าลดราคา")} />);
const SearchResultsPage = lazyPage(() => import("@/features/catalog/pages/SearchResultsPage").then((m) => m.SearchResultsPage), <CatalogPageSkeleton label={msg("routes.loading.searchResults", "กำลังโหลดผลการค้นหา")} />);

const PublicSellerPage = lazyPage(() => import("@/features/store/pages/PublicSellerPage").then((m) => m.PublicSellerPage), <ProfilePageSkeleton label={msg("routes.loading.publicSeller", "กำลังโหลดร้านค้า")} />);
const PublicCollectionPage = lazyPage(() => import("@/features/collection/pages/PublicCollectionPage").then((m) => m.PublicCollectionPage), <ProfilePageSkeleton label={msg("routes.loading.publicCollection", "กำลังโหลดคอลเลกชัน")} />);

const CartPage = lazyPage(() => import("@/features/cart/pages/CartPage").then((m) => m.CartPage), <FormPageSkeleton label={msg("routes.loading.cart", "กำลังโหลดตะกร้า")} />);
const CheckoutPage = lazyPage(() => import("@/features/cart/pages/CheckoutPage").then((m) => m.CheckoutPage), <FormPageSkeleton label={msg("routes.loading.checkout", "กำลังโหลดหน้าชำระเงิน")} />);

const AboutPage = lazyPage(() => import("@/features/about/pages/AboutPage").then((m) => m.AboutPage), <ArticlePageSkeleton />);
const TermsOfServicePage = lazyPage(() => import("@/features/legal/pages/TermsOfServicePage").then((m) => m.TermsOfServicePage), <ArticlePageSkeleton />);
const PrivacyPolicyPage = lazyPage(() => import("@/features/legal/pages/PrivacyPolicyPage").then((m) => m.PrivacyPolicyPage), <ArticlePageSkeleton />);

const PaymentPage = lazyPage(() => import("@/features/payment/pages/PaymentPage").then((m) => m.PaymentPage), <FormPageSkeleton label={msg("routes.loading.payment", "กำลังโหลดหน้าชำระเงิน")} />);
const PaymentSuccessPage = lazyPage(() => import("@/features/payment/pages/PaymentSuccessPage").then((m) => m.PaymentSuccessPage), <FormPageSkeleton />);
const ProfilePage = lazyPage(() => import("@/features/account/pages/ProfilePage").then((m) => m.ProfilePage), <AccountPageSkeleton label={msg("routes.loading.profile", "กำลังโหลดโปรไฟล์")} />);
const OrderHistoryPage = lazyPage(() => import("@/features/account/pages/OrderHistoryPage").then((m) => m.OrderHistoryPage), <AccountPageSkeleton label={msg("routes.loading.orderHistory", "กำลังโหลดคำสั่งซื้อ")} />);
const AddressBookPage = lazyPage(() => import("@/features/account/pages/AddressBookPage").then((m) => m.AddressBookPage), <AccountPageSkeleton label={msg("routes.loading.addressBook", "กำลังโหลดที่อยู่")} />);
const MyCouponsPage = lazyPage(() => import("@/features/account/pages/MyCouponsPage").then((m) => m.MyCouponsPage), <AccountPageSkeleton label={msg("routes.loading.myCoupons", "กำลังโหลดโค้ดของฉัน")} />);
const MyCollectionPage = lazyPage(() => import("@/features/collection/pages/MyCollectionPage").then((m) => m.MyCollectionPage), <CatalogPageSkeleton label={msg("routes.loading.myCollection", "กำลังโหลดคอลเลกชัน")} />);
const SellerApplicationPage = lazyPage(() => import("@/features/seller/application/SellerApplicationPage").then((m) => m.SellerApplicationPage), <FormPageSkeleton />);
const AuctionListPage = lazyPage(() => import("@/features/auction/pages/AuctionListPage").then((m) => m.AuctionListPage), <CatalogPageSkeleton label={msg("routes.loading.auctionList", "กำลังโหลดประมูล")} />);
const AuctionDetailPage = lazyPage(() => import("@/features/auction/pages/AuctionDetailPage").then((m) => m.AuctionDetailPage), <DetailPageSkeleton label={msg("routes.loading.auctionDetail", "กำลังโหลดประมูล")} />);
const MyAuctionsPage = lazyPage(() => import("@/features/auction/pages/MyAuctionsPage").then((m) => m.MyAuctionsPage), <AccountPageSkeleton label={msg("routes.loading.myAuctions", "กำลังโหลดการประมูลของฉัน")} />);
const NotFoundPage = lazyPage(() => import("@/features/not-found/pages/NotFoundPage").then((m) => m.NotFoundPage), <ArticlePageSkeleton />);


/** เส้นทางฝั่งผู้ซื้อ / หน้าสาธารณะ — ใช้ PublicLayout (Navbar + Footer) */
export const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { index: true, handle: { title: msg("routes.title.public.index", "หน้าแรก") }, element: <HomePage /> },

    { path: "products", element: <LegacyProductsRedirect /> },
    { path: "products/:productId", handle: { title: msg("routes.title.public.productsProductId", "สินค้า") }, element: <ProductDetailPage /> },
    { path: "collectors/:username", handle: { title: msg("routes.title.public.collectorsUsername", "นักสะสม") }, element: <CollectorProfilePage /> },
    { path: "products/:productId/listings", handle: { title: msg("routes.title.public.productsProductIdListings", "ประกาศขาย") }, element: <MarketListingsPage /> },
    { path: "listings/:listingId", handle: { title: msg("routes.title.public.listingsListingId", "ประกาศขาย") }, element: <ListingDetailPage /> },
    { path: "pokemon", element: <LegacyGameRedirect gameCode="POKEMON" fallbackSlug="pokemon-tcg" /> },
    { path: "one-piece", element: <LegacyGameRedirect gameCode="ONE_PIECE" fallbackSlug="one-piece-card-game" /> },
    { path: "search", handle: { title: msg("routes.title.public.search", "ค้นหา") }, element: <SearchResultsPage /> },
    // หน้า SALE — ราคาลดแล้วไม่ต้องใช้โค้ด [TCG-683]
    { path: "sale", handle: { title: msg("routes.title.public.sale", "สินค้าลดราคา") }, element: <SalePage /> },
    { path: "sale/:slug", handle: { title: msg("routes.title.public.saleSlug", "สินค้าลดราคา") }, element: <SalePage /> },
    // ระบบประมูล [TCG-627] — guest ดูได้ บิดต้องล็อกอิน (เช็กตอนกดบิด)
    { path: "auctions", handle: { title: msg("routes.title.public.auctions", "ประมูล") }, element: <AuctionListPage /> },
    { path: "auctions/:auctionId", handle: { title: msg("routes.title.public.auctionsAuctionId", "ประมูล") }, element: <AuctionDetailPage /> },

    { path: "store/:storeId", element: <StoreRedirect /> },
    { path: "u/:username", handle: { title: msg("routes.title.public.uUsername", "ร้านค้า") }, element: <PublicSellerPage /> },
    { path: "users/:username", handle: { title: msg("routes.title.public.usersUsername", "คอลเลกชัน") }, element: <PublicCollectionPage /> },

    { path: "cart", handle: { title: msg("routes.title.public.cart", "ตะกร้าสินค้า") }, element: <CartPage /> },
    { path: "checkout", handle: { title: msg("routes.title.public.checkout", "ชำระเงิน") }, element: <CheckoutPage /> },

    { path: "about", handle: { title: msg("routes.title.public.about", "เกี่ยวกับเรา") }, element: <AboutPage /> },
    { path: "terms-of-service", handle: { title: msg("routes.title.public.termsOfService", "ข้อตกลงการใช้งาน") }, element: <TermsOfServicePage /> },
    { path: "privacy-policy", handle: { title: msg("routes.title.public.privacyPolicy", "นโยบายความเป็นส่วนตัว") }, element: <PrivacyPolicyPage /> },

    {
      element: <RequireAuth />,
      children: [
        { path: "payment", handle: { title: msg("routes.title.public.payment", "ชำระเงิน") }, element: <PaymentPage /> },
        { path: "payment/success", handle: { title: msg("routes.title.public.paymentSuccess", "ชำระเงินสำเร็จ") }, element: <PaymentSuccessPage /> },
        // sidebar อยู่ใน AccountLayout — เปลี่ยนแท็บแล้วโหลดใหม่แค่เนื้อหา [TCG-732]
        {
          path: "account",
          element: <AccountLayout />,
          children: [
            { path: "profile", handle: { title: msg("routes.title.public.profile", "โปรไฟล์") }, element: <ProfilePage /> },
            { path: "orders", handle: { title: msg("routes.title.public.orders", "คำสั่งซื้อของฉัน") }, element: <OrderHistoryPage /> },
            { path: "addresses", handle: { title: msg("routes.title.public.addresses", "ที่อยู่") }, element: <AddressBookPage /> },
            { path: "coupons", handle: { title: msg("routes.title.public.coupons", "โค้ดของฉัน") }, element: <MyCouponsPage /> },
            { path: "auctions", handle: { title: msg("routes.title.public.auctions2", "การประมูลของฉัน") }, element: <MyAuctionsPage /> },
          ],
        },
        // คอลเลกชันใช้หน้าเต็มของตัวเอง ไม่มี sidebar
        { path: "account/collection", handle: { title: msg("routes.title.public.accountCollection", "คอลเลกชันของฉัน") }, element: <MyCollectionPage /> },
        // ยื่นคำขอผ่าน /sellers/me ต้องรู้ว่าเป็นใคร
        { path: "become-a-seller", handle: { title: msg("routes.title.public.becomeASeller", "สมัครเป็นผู้ขาย") }, element: <SellerApplicationPage /> },
      ],
    },

    { path: "*", handle: { title: msg("routes.title.public.notFound", "ไม่พบหน้านี้") }, element: <NotFoundPage /> },
  ],
};

// key ของ msg() ด้านบน — ประกาศให้ tolgee CLI เห็น (msg ไม่ใช่ t) [TCG-550]
// @tolgee-key {"key": "routes.title.public.index", "ns": "common", "defaultValue": "หน้าแรก"}
// @tolgee-key {"key": "routes.title.public.productsProductId", "ns": "common", "defaultValue": "สินค้า"}
// @tolgee-key {"key": "routes.title.public.collectorsUsername", "ns": "common", "defaultValue": "นักสะสม"}
// @tolgee-key {"key": "routes.title.public.productsProductIdListings", "ns": "common", "defaultValue": "ประกาศขาย"}
// @tolgee-key {"key": "routes.title.public.listingsListingId", "ns": "common", "defaultValue": "ประกาศขาย"}
// @tolgee-key {"key": "routes.title.public.search", "ns": "common", "defaultValue": "ค้นหา"}
// @tolgee-key {"key": "routes.title.public.sale", "ns": "common", "defaultValue": "สินค้าลดราคา"}
// @tolgee-key {"key": "routes.title.public.saleSlug", "ns": "common", "defaultValue": "สินค้าลดราคา"}
// @tolgee-key {"key": "routes.title.public.auctions", "ns": "common", "defaultValue": "ประมูล"}
// @tolgee-key {"key": "routes.title.public.auctionsAuctionId", "ns": "common", "defaultValue": "ประมูล"}
// @tolgee-key {"key": "routes.title.public.uUsername", "ns": "common", "defaultValue": "ร้านค้า"}
// @tolgee-key {"key": "routes.title.public.usersUsername", "ns": "common", "defaultValue": "คอลเลกชัน"}
// @tolgee-key {"key": "routes.title.public.cart", "ns": "common", "defaultValue": "ตะกร้าสินค้า"}
// @tolgee-key {"key": "routes.title.public.checkout", "ns": "common", "defaultValue": "ชำระเงิน"}
// @tolgee-key {"key": "routes.title.public.about", "ns": "common", "defaultValue": "เกี่ยวกับเรา"}
// @tolgee-key {"key": "routes.title.public.termsOfService", "ns": "common", "defaultValue": "ข้อตกลงการใช้งาน"}
// @tolgee-key {"key": "routes.title.public.privacyPolicy", "ns": "common", "defaultValue": "นโยบายความเป็นส่วนตัว"}
// @tolgee-key {"key": "routes.title.public.payment", "ns": "common", "defaultValue": "ชำระเงิน"}
// @tolgee-key {"key": "routes.title.public.paymentSuccess", "ns": "common", "defaultValue": "ชำระเงินสำเร็จ"}
// @tolgee-key {"key": "routes.title.public.profile", "ns": "common", "defaultValue": "โปรไฟล์"}
// @tolgee-key {"key": "routes.title.public.orders", "ns": "common", "defaultValue": "คำสั่งซื้อของฉัน"}
// @tolgee-key {"key": "routes.title.public.addresses", "ns": "common", "defaultValue": "ที่อยู่"}
// @tolgee-key {"key": "routes.title.public.coupons", "ns": "common", "defaultValue": "โค้ดของฉัน"}
// @tolgee-key {"key": "routes.title.public.auctions2", "ns": "common", "defaultValue": "การประมูลของฉัน"}
// @tolgee-key {"key": "routes.title.public.accountCollection", "ns": "common", "defaultValue": "คอลเลกชันของฉัน"}
// @tolgee-key {"key": "routes.title.public.becomeASeller", "ns": "common", "defaultValue": "สมัครเป็นผู้ขาย"}
// @tolgee-key {"key": "routes.title.public.notFound", "ns": "common", "defaultValue": "ไม่พบหน้านี้"}
// @tolgee-key {"key": "routes.loading.productDetail", "ns": "common", "defaultValue": "กำลังโหลดสินค้า"}
// @tolgee-key {"key": "routes.loading.collectorProfile", "ns": "common", "defaultValue": "กำลังโหลดโปรไฟล์นักสะสม"}
// @tolgee-key {"key": "routes.loading.marketListings", "ns": "common", "defaultValue": "กำลังโหลดประกาศขาย"}
// @tolgee-key {"key": "routes.loading.listingDetail", "ns": "common", "defaultValue": "กำลังโหลดประกาศขาย"}
// @tolgee-key {"key": "routes.loading.sale", "ns": "common", "defaultValue": "กำลังโหลดสินค้าลดราคา"}
// @tolgee-key {"key": "routes.loading.searchResults", "ns": "common", "defaultValue": "กำลังโหลดผลการค้นหา"}
// @tolgee-key {"key": "routes.loading.publicSeller", "ns": "common", "defaultValue": "กำลังโหลดร้านค้า"}
// @tolgee-key {"key": "routes.loading.publicCollection", "ns": "common", "defaultValue": "กำลังโหลดคอลเลกชัน"}
// @tolgee-key {"key": "routes.loading.cart", "ns": "common", "defaultValue": "กำลังโหลดตะกร้า"}
// @tolgee-key {"key": "routes.loading.checkout", "ns": "common", "defaultValue": "กำลังโหลดหน้าชำระเงิน"}
// @tolgee-key {"key": "routes.loading.payment", "ns": "common", "defaultValue": "กำลังโหลดหน้าชำระเงิน"}
// @tolgee-key {"key": "routes.loading.profile", "ns": "common", "defaultValue": "กำลังโหลดโปรไฟล์"}
// @tolgee-key {"key": "routes.loading.orderHistory", "ns": "common", "defaultValue": "กำลังโหลดคำสั่งซื้อ"}
// @tolgee-key {"key": "routes.loading.addressBook", "ns": "common", "defaultValue": "กำลังโหลดที่อยู่"}
// @tolgee-key {"key": "routes.loading.myCoupons", "ns": "common", "defaultValue": "กำลังโหลดโค้ดของฉัน"}
// @tolgee-key {"key": "routes.loading.myCollection", "ns": "common", "defaultValue": "กำลังโหลดคอลเลกชัน"}
// @tolgee-key {"key": "routes.loading.auctionList", "ns": "common", "defaultValue": "กำลังโหลดประมูล"}
// @tolgee-key {"key": "routes.loading.auctionDetail", "ns": "common", "defaultValue": "กำลังโหลดประมูล"}
// @tolgee-key {"key": "routes.loading.myAuctions", "ns": "common", "defaultValue": "กำลังโหลดการประมูลของฉัน"}
