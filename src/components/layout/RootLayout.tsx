import { Outlet, ScrollRestoration } from "react-router-dom";

/**
 * Root layout component placed at the top level of the router hierarchy.
 * Includes <ScrollRestoration /> to ensure that any route navigation
 * automatically resets the window scroll position to (0, 0).
 */
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
