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

import { RestockContent } from "./components/restock/RestockContent";
import { getRestockData } from "./restock.api";

export function SellerProductRestockPage() {
  const { productId = "" } = useParams();
  const data = getRestockData(productId);

  // กดมาจากเมนูของแถวล่าง ๆ ในตารางสินค้า ไม่ให้เปิดมาค้างกลางหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [productId]);

  if (!data) {
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

  // key ตามสินค้า — สลับไปสินค้าอื่นแล้วค่าที่กรอกค้างไว้ต้องล้าง
  return <RestockContent key={data.productId} data={data} />;
}
