import { useEffect } from "react";

import { SearchXIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { OrderDetailContent } from "./components/detail/OrderDetailContent";
import { getOrderDetail } from "./order-detail.api";

export function SellerOrderDetailPage() {
  const { orderId = "" } = useParams();
  const detail = getOrderDetail(orderId);

  // กดลิงก์มาจากการ์ดล่าง ๆ ของหน้ารายการ ไม่ให้เปิดมาค้างกลางหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [orderId]);

  if (!detail) {
    return (
      <Empty className="rounded-xl border border-border bg-white">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>ไม่พบคำสั่งซื้อ {orderId}</EmptyTitle>
          <EmptyDescription>
            คำสั่งซื้อนี้อาจถูกลบไปแล้ว หรือไม่ได้เป็นของร้านคุณ
          </EmptyDescription>
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

  // key ตามเลขออเดอร์ — สลับไปออเดอร์อื่นแล้วค่าที่กรอกค้างไว้ต้องล้าง
  return <OrderDetailContent key={detail.id} data={detail} />;
}
