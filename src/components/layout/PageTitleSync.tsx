import { useEffect } from "react";
import { useMatches } from "react-router-dom";

import { formatPageTitle, usePageTitleOverride, type RouteHandle } from "@/hooks/use-page-title";

/** ผู้เขียน document.title คนเดียว (mount ใน RootLayout): override → handle.title ลึกสุด → ชื่อเว็บ */
export function PageTitleSync() {
  const matches = useMatches();
  const overrideTitle = usePageTitleOverride();
  const handleTitle = matches
    .map((m) => (m.handle as RouteHandle | undefined)?.title)
    .findLast(Boolean);
  const title = formatPageTitle(overrideTitle ?? handleTitle);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
