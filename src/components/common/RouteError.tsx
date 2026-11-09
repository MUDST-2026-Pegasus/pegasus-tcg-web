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

export function RouteError() {
  const error = useRouteError();

  // errorElement ของ root แสดงแทน RootLayout — PageTitleSync ไม่ทำงาน จึงตั้งเอง
  useEffect(() => {
    document.title = formatPageTitle("เกิดข้อผิดพลาด");
  }, []);

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "ไม่ทราบสาเหตุ";

  return (
    <Empty className="min-h-svh">
      <InitialRouteReady />
      <EmptyHeader>
        <EmptyTitle>หน้านี้มีปัญหา</EmptyTitle>
        <EmptyDescription>{detail}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => window.location.reload()}>โหลดใหม่</Button>
      </EmptyContent>
    </Empty>
  );
}
