import { lazy, Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";

import { PageTitleSync } from "@/components/layout/PageTitleSync";
import { FaroPageViewTracker } from "@/observability/FaroPageViewTracker";

/**
 * Root layout component placed at the top level of the router hierarchy.
 * Includes <ScrollRestoration /> to ensure that any route navigation
 * automatically resets the window scroll position to (0, 0).
 */
// แยก chunk — tsparticles ไม่ต้องอยู่ใน bundle แรก
const Snowfall = lazy(() => import("@/components/layout/Snowfall").then((m) => ({ default: m.Snowfall })));

export function RootLayout() {
  return (
    <>
      <PageTitleSync />
      <FaroPageViewTracker />
      <ScrollRestoration />
      <Outlet />
      {/* tsparticles ต้องใช้ OffscreenCanvas — เบราว์เซอร์เก่าและ jsdom ในเทสต์ไม่มี ก็ไม่แสดงหิมะ */}
      {typeof OffscreenCanvas !== "undefined" && (
        <Suspense fallback={null}>
          <Snowfall />
        </Suspense>
      )}
    </>
  );
}
