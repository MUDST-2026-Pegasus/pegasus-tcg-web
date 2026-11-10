import { useEffect } from "react";
import { useMatches } from "react-router-dom";

import { formatPageTitle, usePageTitleOverride, type RouteHandle } from "@/hooks/use-page-title";
import { useMessage } from "@/lib/i18n";

/** ผู้เขียน document.title คนเดียว (mount ใน RootLayout): override → handle.title ลึกสุด → ชื่อเว็บ */
export function PageTitleSync() {
  const matches = useMatches();
  const overrideTitle = usePageTitleOverride();
  const message = useMessage();
  const handleTitle = message(matches.map((m) => (m.handle as RouteHandle | undefined)?.title).findLast(Boolean));
  const title = formatPageTitle(overrideTitle ?? handleTitle);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
