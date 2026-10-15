import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";

import type { PublicListingDto } from "./catalog.types";
import { formatSellerReputation } from "./listing.format";

export function ListingSeller({ seller, productSlug }: { seller: PublicListingDto["seller"]; productSlug: string }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        {seller.verified && <BadgeCheck aria-label="ร้านค้ายืนยันแล้ว" className="size-4 shrink-0 fill-primary text-white" />}
        <Link
          to={`/u/${encodeURIComponent(seller.username)}?from=${encodeURIComponent(productSlug)}`}
          className="truncate text-sm font-bold hover:text-primary hover:underline"
        >
          {seller.displayName || seller.username}
        </Link>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">{formatSellerReputation(seller)}</p>
    </div>
  );
}
