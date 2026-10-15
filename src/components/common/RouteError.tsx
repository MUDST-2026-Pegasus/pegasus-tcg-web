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

export function RouteError() {
  const error = useRouteError();

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
