import { SearchXIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** หน้าย่อยของสินค้า (เติมสต็อก / แก้ไข) เปิดด้วยรหัสสินค้าที่ไม่มีอยู่ */
export function ProductNotFound() {
  return (
    <Empty className="rounded-xl border border-border bg-white">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>ไม่พบสินค้านี้</EmptyTitle>
        <EmptyDescription>
          สินค้านี้อาจถูกลบไปแล้ว หรือไม่ได้เป็นของร้านคุณ
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="sm"
          className="rounded-md px-2.5"
          render={<Link to="/seller/products" />}
          nativeButton={false}
        >
          กลับไปหน้าจัดการสินค้า
        </Button>
      </EmptyContent>
    </Empty>
  );
}
