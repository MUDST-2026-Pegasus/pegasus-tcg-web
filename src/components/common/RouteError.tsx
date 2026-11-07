import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { InitialRouteReady } from "@/app/InitialRouteReady";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export function RouteError() {
  const { text } = useLanguage();
  const error = useRouteError();

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : text("ไม่ทราบสาเหตุ", "Unknown error");

  return (
    <Empty className="min-h-svh">
      <InitialRouteReady />
      <EmptyHeader>
        <EmptyTitle>{text("หน้านี้มีปัญหา", "This page encountered a problem")}</EmptyTitle>
        <EmptyDescription>{detail}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => window.location.reload()}>{text("โหลดใหม่", "Reload")}</Button>
      </EmptyContent>
    </Empty>
  );
}
