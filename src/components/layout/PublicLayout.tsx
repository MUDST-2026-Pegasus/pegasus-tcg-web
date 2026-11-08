import { QuickCartToaster } from "@/components/common/QuickCartToaster";
import { MiniCartDrawer } from "@/features/cart/components/MiniCartDrawer";
import { Outlet } from "react-router-dom";

import { PageTransition } from "@/components/common/PageTransition";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PendingClaimRunner } from "@/features/promotions/PendingClaimRunner";

/**
 * โครงหน้าฝั่งผู้ซื้อ / หน้าสาธารณะ — Navbar + เนื้อหา + Footer
 * ใช้กับ: Home, Products, Search, Store, Cart, Checkout, About, Account
 */
// แท็บใน AccountLayout เป็นหน้าเดียวกัน — sidebar ไม่ถูก mount ใหม่ [TCG-732]
const ACCOUNT_TAB = /^\/account\/(profile|orders|addresses|coupons|auctions)\/?$/;

function publicTransitionKey(pathname: string) {
  return ACCOUNT_TAB.test(pathname) ? "/account" : pathname;
}

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      {/* guest กดเก็บโค้ดแล้วไป login — กลับมาหน้าไหนก็เก็บให้ที่นี่ */}
      <PendingClaimRunner />
      <main className="flex-1">
        <PageTransition transitionKey={publicTransitionKey}>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <MiniCartDrawer />
      <QuickCartToaster />
    </div>
  );
}
