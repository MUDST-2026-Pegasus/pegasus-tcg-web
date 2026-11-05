import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { getFaroClient } from "@/observability/faro";

/** Send one Faro view for each SPA pathname, including the initial route. */
export function FaroPageViewTracker() {
  const { pathname } = useLocation();
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    if (lastPathname.current === pathname) {
      return;
    }

    lastPathname.current = pathname;
    getFaroClient()?.api.setView({ name: pathname });
  }, [pathname]);

  return null;
}
