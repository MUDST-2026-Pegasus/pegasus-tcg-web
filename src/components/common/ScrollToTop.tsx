import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop listens to pathname changes and resets the window scroll position to (0, 0).
 * Useful for global scroll reset across client-side route navigations.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
