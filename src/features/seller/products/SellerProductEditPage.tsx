import { useEffect } from "react";

import { useParams, useSearchParams } from "react-router-dom";

import { ProductNotFound } from "./components/ProductNotFound";
import { ProductEditContent } from "./components/edit/ProductEditContent";
import { getProductEditData } from "./product-edit.api";

export function SellerProductEditPage() {
  const { productId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const data = getProductEditData(productId);

  // ?focus=price มาจากปุ่ม "ปรับราคาขาย" — ช่องราคาโฟกัสเองแล้ว ไม่ต้องเลื่อนขึ้นบนสุด
  const focusPrice = searchParams.get("focus") === "price";

  useEffect(() => {
    if (!focusPrice) window.scrollTo({ top: 0, behavior: "auto" });
  }, [productId, focusPrice]);

  if (!data) return <ProductNotFound />;

  // key ตามสินค้า — สลับไปสินค้าอื่นแล้วค่าที่แก้ค้างไว้ต้องล้าง
  return (
    <ProductEditContent
      key={data.productId}
      data={data}
      focusPrice={focusPrice}
    />
  );
}
