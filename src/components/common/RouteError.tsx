import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { InitialRouteReady } from "@/app/InitialRouteReady";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatPageTitle } from "@/hooks/use-page-title";
import { useTranslate } from "@/lib/i18n";

export function RouteError() {
  const error = useRouteError();
  const { t } = useTranslate();

  // errorElement ของ root แสดงแทน RootLayout — PageTitleSync ไม่ทำงาน จึงตั้งเอง
  useEffect(() => {
    document.title = formatPageTitle(t("routes.title.error", "เกิดข้อผิดพลาด"));
  }, [t]);

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t("states.unknownCause", "ไม่ทราบสาเหตุ");

  return (
    <Empty className="min-h-svh">
      <InitialRouteReady />
      <EmptyHeader>
        <EmptyTitle>{t("routeError.title", "หน้านี้มีปัญหา")}</EmptyTitle>
        <EmptyDescription>{detail}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => window.location.reload()}>{t("actions.reload", "โหลดใหม่")}</Button>
      </EmptyContent>
    </Empty>
  );
}
