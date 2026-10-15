import { Outlet } from "react-router-dom";

import { PageTransition } from "@/components/common/PageTransition";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * โครงหน้าฝั่งผู้ซื้อ / หน้าสาธารณะ — Navbar + เนื้อหา + Footer
 * ใช้กับ: Home, Products, Search, Store, Cart, Checkout, About, Account
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
