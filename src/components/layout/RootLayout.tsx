import { Outlet, ScrollRestoration } from "react-router-dom";

import { PageTitleSync } from "@/components/layout/PageTitleSync";
import { Snowfall } from "@/components/layout/Snowfall";
import { FaroPageViewTracker } from "@/observability/FaroPageViewTracker";

/**
 * Root layout component placed at the top level of the router hierarchy.
 * Includes <ScrollRestoration /> to ensure that any route navigation
 * automatically resets the window scroll position to (0, 0).
 */
export function RootLayout() {
  return (
    <>
      <PageTitleSync />
      <FaroPageViewTracker />
      <ScrollRestoration />
      <Outlet />
      <Snowfall />
    </>
  );
}
