import { useEffect } from "react";

import { useParams, useSearchParams } from "react-router-dom";

import { QueryBoundary } from "@/components/common";
import { hasErrorCode } from "@/lib/api";

import { ProductNotFound } from "./components/ProductNotFound";
import { ProductEditContent } from "./components/edit/ProductEditContent";
import { getProductEditData } from "./product-edit.api";
import { parseListingId } from "./products.format";
import { useMyListing } from "./products.queries";

export function SellerProductEditPage() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const listingId = parseListingId(productId);

  // ?focus=price มาจากปุ่ม "ปรับราคาขาย" — ช่องราคาโฟกัสเองแล้ว ไม่ต้องเลื่อนขึ้นบนสุด
  const focusPrice = searchParams.get("focus") === "price";

  useEffect(() => {
    if (!focusPrice) window.scrollTo({ top: 0, behavior: "auto" });
  }, [productId, focusPrice]);

  if (listingId === null) return <ProductNotFound />;

  return <ListingEditLoader listingId={listingId} focusPrice={focusPrice} />;
}

function ListingEditLoader({
  listingId,
  focusPrice,
}: {
  listingId: number;
  focusPrice: boolean;
}) {
  const listing = useMyListing(listingId);

  if (hasErrorCode(listing.error, "LISTING_NOT_FOUND")) {
    return <ProductNotFound />;
  }

  return (
    <QueryBoundary query={listing}>
      {(data) => {
        const edit = getProductEditData(data);
        // key ตามสินค้า — สลับไปสินค้าอื่นแล้วค่าที่แก้ค้างไว้ต้องล้าง
        return (
          <ProductEditContent
            key={edit.productId}
            data={edit}
            focusPrice={focusPrice}
          />
        );
      }}
    </QueryBoundary>
  );
}
