import { useEffect } from "react";

import { useParams } from "react-router-dom";

import { QueryBoundary } from "@/components/common";
import { hasErrorCode } from "@/lib/api";

import { ProductNotFound } from "./components/ProductNotFound";
import { RestockContent } from "./components/restock/RestockContent";
import { parseListingId } from "./products.format";
import { useMyListing } from "./products.queries";
import { getRestockData } from "./restock.api";

export function SellerProductRestockPage() {
  const { productId } = useParams();
  const listingId = parseListingId(productId);

  // กดมาจากเมนูของแถวล่าง ๆ ในตารางสินค้า ไม่ให้เปิดมาค้างกลางหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [productId]);

  if (listingId === null) return <ProductNotFound />;

  return <ListingRestockLoader listingId={listingId} />;
}

function ListingRestockLoader({ listingId }: { listingId: number }) {
  const listing = useMyListing(listingId);

  if (hasErrorCode(listing.error, "LISTING_NOT_FOUND")) {
    return <ProductNotFound />;
  }

  return (
    <QueryBoundary query={listing}>
      {(data) => {
        const restock = getRestockData(data);
        // key ตามสินค้า — สลับไปสินค้าอื่นแล้วค่าที่กรอกค้างไว้ต้องล้าง
        return <RestockContent key={restock.productId} data={restock} />;
      }}
    </QueryBoundary>
  );
}
