import { useEffect } from "react";

import { useParams } from "react-router-dom";

import { ProductNotFound } from "./components/ProductNotFound";
import { RestockContent } from "./components/restock/RestockContent";
import { getRestockData } from "./restock.api";

export function SellerProductRestockPage() {
  const { productId = "" } = useParams();
  const data = getRestockData(productId);

  // กดมาจากเมนูของแถวล่าง ๆ ในตารางสินค้า ไม่ให้เปิดมาค้างกลางหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [productId]);

  if (!data) return <ProductNotFound />;

  // key ตามสินค้า — สลับไปสินค้าอื่นแล้วค่าที่กรอกค้างไว้ต้องล้าง
  return <RestockContent key={data.productId} data={data} />;
}
