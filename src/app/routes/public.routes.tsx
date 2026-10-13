import type { RouteObject } from "react-router-dom";

import { PagePlaceholder } from "@/components/common/PagePlaceholder";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AboutPage } from "@/features/about/pages/AboutPage";
import { AddressBookPage } from "@/features/account/pages/AddressBookPage";
import { OrderHistoryPage } from "@/features/account/pages/OrderHistoryPage";
import { ProfilePage } from "@/features/account/pages/ProfilePage";
import { CartPage } from "@/features/cart/pages/CartPage";
import { CheckoutPage } from "@/features/cart/pages/CheckoutPage";
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage";
import { CollectorProfilePage } from "@/features/catalog/pages/CollectorProfilePage";
import { MarketListingsPage } from "@/features/catalog/pages/MarketListingsPage";
import { ListingDetailPage } from "@/features/catalog/pages/ListingDetailPage";
import { ProductListPage } from "@/features/catalog/pages/ProductListPage";
import { MyCollectionPage } from "@/features/collection/pages/MyCollectionPage";
import { PublicCollectionPage } from "@/features/collection/pages/PublicCollectionPage";
import { SearchResultsPage } from "@/features/catalog/pages/SearchResultsPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { TermsOfServicePage } from "@/features/legal/pages/TermsOfServicePage";
import { PrivacyPolicyPage } from "@/features/legal/pages/PrivacyPolicyPage";
import { StoreProfilePage } from "@/features/store/pages/StoreProfilePage";
import { PublicSellerPage } from "@/features/store/pages/PublicSellerPage";
import { PaymentPage } from "@/features/payment/pages/PaymentPage";
import { PaymentSuccessPage } from "@/features/payment/pages/PaymentSuccessPage";
import { SellerApplicationPage } from "@/features/seller/application/SellerApplicationPage";

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
    { path: "sale", element: <PagePlaceholder title="Sale" /> },
    { path: "new-arrivals", element: <PagePlaceholder title="New arrivals" /> },
    { path: "pokemon", element: <ProductListPage key="pokemon" gameCode="POKEMON" title="Pokémon" /> },
    { path: "one-piece", element: <ProductListPage key="one-piece" gameCode="ONE_PIECE" title="One Piece" /> },
    { path: "search", element: <SearchResultsPage /> },

    { path: "store/:storeId", element: <StoreProfilePage /> },
    { path: "u/:username", element: <PublicSellerPage /> },
    { path: "users/:username", element: <PublicCollectionPage /> },

    { path: "cart", element: <CartPage /> },
    { path: "checkout", element: <CheckoutPage /> },
    { path: "payment", element: <PaymentPage /> },
    { path: "payment/success", element: <PaymentSuccessPage /> },

    { path: "about", element: <AboutPage /> },
    { path: "terms-of-service", element: <TermsOfServicePage /> },
    { path: "privacy-policy", element: <PrivacyPolicyPage /> },

    {
      element: <RequireAuth />,
      children: [
        { path: "account/profile", element: <ProfilePage /> },
        { path: "account/orders", element: <OrderHistoryPage /> },
        { path: "account/addresses", element: <AddressBookPage /> },
        { path: "account/collection", element: <MyCollectionPage /> },
        // ยื่นคำขอผ่าน /sellers/me ต้องรู้ว่าเป็นใคร
        { path: "become-a-seller", element: <SellerApplicationPage /> },
      ],
    },

    { path: "*", element: <PagePlaceholder title="ไม่พบหน้านี้" /> },
  ],
};
