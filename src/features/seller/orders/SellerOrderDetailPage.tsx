import { useEffect } from "react";

import { SearchXIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { hasErrorCode } from "@/lib/api";

import { OrderDetailContent } from "./components/detail/OrderDetailContent";
import { OrderDetailSkeleton } from "./components/detail/OrderDetailSkeleton";
import { useSellerOrder } from "./orders.queries";

function parseOrderId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function SellerOrderDetailPage() {
  const { orderId } = useParams();
  const id = parseOrderId(orderId);
  const order = useSellerOrder(id);

  // กดลิงก์มาจากการ์ดล่าง ๆ ของหน้ารายการ ไม่ให้เปิดมาค้างกลางหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [orderId]);

  // เลขไม่ใช่ตัวเลข หรือเป็นของร้านอื่น (backend ตอบ 404 ไม่บอกว่ามีอยู่จริง)
  if (id === null || (order.isError && hasErrorCode(order.error, "ORDER_NOT_FOUND"))) {
    return (
      <Empty className="rounded-xl border border-border bg-white">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>ไม่พบคำสั่งซื้อ {orderId}</EmptyTitle>
          <EmptyDescription>คำสั่งซื้อนี้อาจไม่มีอยู่ หรือไม่ได้เป็นของร้านคุณ</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md px-2.5"
            render={<Link to="/seller/orders" />}
            nativeButton={false}
          >
            กลับไปหน้าจัดการคำสั่งซื้อ
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <QueryBoundary query={order} loading={<OrderDetailSkeleton />} errorTitle="โหลดคำสั่งซื้อไม่สำเร็จ">
      {/* key ตามเลขออเดอร์ — สลับไปออเดอร์อื่นแล้วค่าที่กรอกค้างไว้ต้องล้าง */}
      {(detail) => <OrderDetailContent key={detail.summary.order.id} detail={detail} />}
    </QueryBoundary>
  );
}
