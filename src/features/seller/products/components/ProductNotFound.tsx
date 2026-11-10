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
import { useTranslate } from "@/lib/i18n";

/** หน้าย่อยของสินค้า (เติมสต็อก / แก้ไข) เปิดด้วยรหัสสินค้าที่ไม่มีอยู่ */
export function ProductNotFound() {
  const { t } = useTranslate("seller");
  return (
    <Empty className="rounded-xl border border-border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>{t("products.notFound.title", "ไม่พบสินค้านี้")}</EmptyTitle>
        <EmptyDescription>
          {t("products.notFound.description", "สินค้านี้อาจถูกลบไปแล้ว หรือไม่ได้เป็นของร้านคุณ")}
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
          {t("products.notFound.back", "กลับไปหน้าจัดการสินค้า")}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
